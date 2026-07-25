import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch Invoice and Client Details
    const { data: invoiceRaw, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, client:clients(*), tenant:tenants(name, stripe_account_id)')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoiceRaw) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = invoiceRaw as any;

    // 2. Check if Stripe Account is connected (for Destination Charges if applicable)
    // For this example, we assume we might create a direct Payment Link.
    // If the agency uses their own Stripe account (not connected), they wouldn't need transfer_data.
    // Assuming standard platform setup:
    const stripeAccountId = invoice.tenant.stripe_account_id;

    let isRecurring = false;
    try {
      if (invoice.notes) {
        const notesObj = JSON.parse(invoice.notes);
        isRecurring = notesObj.is_recurring === true;
      }
    } catch (e) {
      // ignore parse errors
    }
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: invoice.description,
              description: `Invoice for ${invoice.client.name}${isRecurring ? ' (Monthly)' : ''}`,
            },
            unit_amount: invoice.amount_cents,
            ...(isRecurring ? { recurring: { interval: 'month' } } : {})
          },
          quantity: 1,
        },
      ],
      mode: isRecurring ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?invoice_id=${invoice.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled?invoice_id=${invoice.id}`,
      customer_email: invoice.client.email || undefined,
      client_reference_id: invoice.id,
      metadata: {
        invoice_id: invoice.id,
        tenant_id: invoice.tenant_id,
        client_id: invoice.client_id,
      },
    };

    if (stripeAccountId) {
      if (isRecurring) {
        sessionParams.subscription_data = {
          application_fee_percent: 1.0, // 1% platform fee
          transfer_data: {
            destination: stripeAccountId,
          },
        };
      } else {
        sessionParams.payment_intent_data = {
          application_fee_amount: Math.round(invoice.amount_cents * 0.01), // 1% platform fee
          transfer_data: {
            destination: stripeAccountId,
          },
          on_behalf_of: stripeAccountId,
        };
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // 4. Update Database with the Link
    await supabase
      .from('invoices')
      .update({ 
        stripe_payment_link_url: session.url,
        status: 'open'
      })
      .eq('id', invoice.id);

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Invoice link generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate payment link', details: error.message },
      { status: 500 }
    );
  }
}
