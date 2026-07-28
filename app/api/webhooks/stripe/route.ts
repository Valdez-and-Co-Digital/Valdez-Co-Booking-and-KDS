import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';
import type { Database } from '@/types/database';

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const tenantId = pi.metadata?.tenant_id;

      if (tenantId) {
        // Update the order's payment status
        await supabase
          .from('orders_appointments')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            stripe_payment_intent_id: pi.id,
          })
          .eq('stripe_payment_intent_id', pi.id);

        // Trigger push notifications to admins
        await notifyAdmins(supabase, tenantId, pi.metadata);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await supabase
        .from('orders_appointments')
        .update({ payment_status: 'unpaid', status: 'cancelled' })
        .eq('stripe_payment_intent_id', pi.id);
      break;
    }

    case 'payment_intent.canceled': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await supabase
        .from('orders_appointments')
        .update({ status: 'cancelled' })
        .eq('stripe_payment_intent_id', pi.id);
      break;
    }

    case 'transfer.created': {
      // Track successful transfers to connected accounts
      const transfer = event.data.object as Stripe.Transfer;
      console.log('[webhook] Transfer created:', transfer.id, 'to:', transfer.destination);
      break;
    }

    // ── Agency Invoice Events ──────────────────────────────────────────────
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase
        .from('agency_invoices')
        .update({
          status: 'paid',
          paid_at: invoice.status_transitions.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
            : new Date().toISOString(),
          stripe_invoice_pdf: invoice.invoice_pdf,
          stripe_invoice_url: invoice.hosted_invoice_url,
        })
        .eq('stripe_invoice_id', invoice.id);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase
        .from('agency_invoices')
        .update({ status: 'overdue' })
        .eq('stripe_invoice_id', invoice.id);
      break;
    }

    case 'invoice.created': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription as string | null;
      if (!subId) break;

      const { data: existing } = await supabase
        .from('agency_invoices')
        .select('id')
        .eq('stripe_invoice_id', invoice.id)
        .maybeSingle();

      if (!existing) {
        const { data: parentInvoice } = await supabase
          .from('agency_invoices')
          .select('client_id, agency_tenant_id, description, coupon_applied')
          .eq('stripe_subscription_id', subId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (parentInvoice) {
          await supabase.from('agency_invoices').insert({
            agency_tenant_id: parentInvoice.agency_tenant_id,
            client_id: parentInvoice.client_id,
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: subId,
            amount_cents: invoice.amount_due,
            description: parentInvoice.description,
            is_recurring: true,
            payment_type: 'stripe',
            status: 'sent',
            coupon_applied: parentInvoice.coupon_applied,
            stripe_invoice_url: invoice.hosted_invoice_url,
            stripe_invoice_pdf: invoice.invoice_pdf,
          });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from('agency_invoices')
        .update({ status: 'void' })
        .eq('stripe_subscription_id', sub.id)
        .eq('status', 'sent');
      break;
    }

    default:
      console.log('[webhook] Unhandled event type:', event.type);
  }

  return NextResponse.json({ received: true });
}

async function notifyAdmins(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  metadata: Record<string, string>
) {
  try {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('tenant_id', tenantId);

    if (!subscriptions?.length) return;

    const webpush = await import('web-push');
    webpush.default.setVapidDetails(
      'mailto:support@swiftkds.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const payload = JSON.stringify({
      title: '🔔 New Order Received!',
      body: `From ${metadata.customer_name} — ${metadata.cart_items}`,
      url: '/dashboard/kds',
    });

    await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.default.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload
        )
      )
    );
  } catch (err) {
    console.error('[webhook] Push notification error:', err);
  }
}
