'use server';

import { stripe } from '@/lib/stripe/server';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type Stripe from 'stripe';

async function getAgencyTenantId(): Promise<string> {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase
    .from('admin_users')
    .select('tenant_id')
    .eq('user_id', session.user.id)
    .single();

  if (!data?.tenant_id) throw new Error('No tenant found');
  return data.tenant_id;
}

export async function getAgencyBillingDefaults() {
  const tenantId = await getAgencyTenantId();
  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single();

  const billing = data?.settings?.agency_billing || {};
  return {
    digital_foundation: parseInt(billing.digital_foundation_price || '500') * 100,
    connected_ordering: parseInt(billing.connected_ordering_price || '1000') * 100,
    complete_kitchen_suite: parseInt(billing.complete_kitchen_suite_price || '1500') * 100,
    platform_fee: parseFloat(billing.platform_fee || '1'),
  };
}

export async function getGlobalBillingDefaults() {
  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase
    .from('tenants')
    .select('settings')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  const billing = data?.settings?.agency_billing || {};
  return {
    digital_foundation: parseInt(billing.digital_foundation_price || '500') * 100,
    connected_ordering: parseInt(billing.connected_ordering_price || '1000') * 100,
    complete_kitchen_suite: parseInt(billing.complete_kitchen_suite_price || '1500') * 100,
    platform_fee: parseFloat(billing.platform_fee || '1'),
  };
}

// ── CLIENTS ──────────────────────────────────────────────────────────────────

export async function createClient(formData: FormData) {
  const tenantId = await getAgencyTenantId();
  const adminSupabase = createAdminClient();

  const name = formData.get('name') as string;
  const businessName = formData.get('business_name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const serviceTier = formData.get('service_tier') as string;
  const customPriceRaw = formData.get('custom_price') as string;
  const platformFeeRaw = formData.get('platform_fee') as string;
  const notes = formData.get('notes') as string;

  const customPriceCents = customPriceRaw
    ? Math.round(parseFloat(customPriceRaw) * 100)
    : null;

  // We map the new form fields to the `prospects` table columns.
  // Note: prospects doesn't have platform_fee_percent yet in our known schema, but we can store it in notes or ignore it for now, 
  // or add it if it exists. For now, we'll store custom_price_cents in invoice_amount.
  const { error } = await adminSupabase.from('prospects').insert({
    tenant_id: tenantId,
    contact_name: name,
    business_name: businessName || name,
    contact_email: email,
    contact_phone: phone || null,
    tier_selected: serviceTier,
    invoice_amount: customPriceCents,
    status: 'new', // Default status for new prospects
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/clients');
}

export async function updateClientStatus(clientId: string, status: string) {
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from('prospects')
    .update({ status })
    .eq('id', clientId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/clients');
}

export async function deleteClient(clientId: string) {
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from('prospects')
    .delete()
    .eq('id', clientId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/clients');
}

// ── INVOICES ─────────────────────────────────────────────────────────────────

export async function sendInvoice(data: {
  clientId: string;
  amountCents: number;
  description: string;
  paymentType: 'stripe' | 'cash';
  isRecurring: boolean;
  couponId?: string;
}) {
  const tenantId = await getAgencyTenantId();
  const adminSupabase = createAdminClient();

  // Fetch client
  const { data: client } = await adminSupabase
    .from('agency_clients')
    .select('*')
    .eq('id', data.clientId)
    .single();

  if (!client) throw new Error('Client not found');

  // Handle cash invoices - no Stripe needed
  if (data.paymentType === 'cash') {
    const { error } = await adminSupabase.from('agency_invoices').insert({
      agency_tenant_id: tenantId,
      client_id: data.clientId,
      amount_cents: data.amountCents,
      description: data.description,
      is_recurring: data.isRecurring,
      payment_type: 'cash',
      status: 'cash_pending',
    });
    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/invoices');
    return { success: true };
  }

  // Ensure Stripe customer exists
  let stripeCustomerId = client.stripe_customer_id;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: client.business_name || client.name,
      email: client.email,
      metadata: { client_id: client.id, agency_tenant_id: tenantId },
    });
    stripeCustomerId = customer.id;
    await adminSupabase
      .from('agency_clients')
      .update({ stripe_customer_id: stripeCustomerId, status: 'active' })
      .eq('id', client.id);
  }

  // Get coupon Stripe ID if provided
  let stripeCouponId: string | undefined;
  if (data.couponId) {
    const { data: coupon } = await adminSupabase
      .from('agency_coupons')
      .select('stripe_coupon_id')
      .eq('id', data.couponId)
      .single();
    stripeCouponId = coupon?.stripe_coupon_id;
  }

  if (data.isRecurring) {
    // Create a recurring Stripe Subscription with an inline price
    const price = await stripe.prices.create({
      unit_amount: data.amountCents,
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: { name: data.description },
    });

    const subParams: Stripe.SubscriptionCreateParams = {
      customer: stripeCustomerId,
      items: [{ price: price.id }],
      collection_method: 'send_invoice',
      days_until_due: 30,
      metadata: { agency_tenant_id: tenantId, client_id: data.clientId },
    };
    if (stripeCouponId) subParams.discounts = [{ coupon: stripeCouponId }];

    const subscription = await stripe.subscriptions.create(subParams);

    // Get the initial invoice
    const invoices = await stripe.invoices.list({ subscription: subscription.id, limit: 1 });
    const stripeInvoice = invoices.data[0];

    await adminSupabase.from('agency_invoices').insert({
      agency_tenant_id: tenantId,
      client_id: data.clientId,
      stripe_invoice_id: stripeInvoice?.id,
      stripe_subscription_id: subscription.id,
      amount_cents: data.amountCents,
      description: data.description,
      is_recurring: true,
      payment_type: 'stripe',
      status: 'sent',
      coupon_applied: data.couponId || null,
      stripe_invoice_url: stripeInvoice?.hosted_invoice_url,
      stripe_invoice_pdf: stripeInvoice?.invoice_pdf,
    });
  } else {
    // One-time invoice
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      metadata: { agency_tenant_id: tenantId, client_id: data.clientId },
    });

    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      amount: data.amountCents,
      currency: 'usd',
      description: data.description,
      invoice: invoice.id,
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
    });

    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    await stripe.invoices.sendInvoice(finalized.id);

    await adminSupabase.from('agency_invoices').insert({
      agency_tenant_id: tenantId,
      client_id: data.clientId,
      stripe_invoice_id: finalized.id,
      amount_cents: data.amountCents,
      description: data.description,
      is_recurring: false,
      payment_type: 'stripe',
      status: 'sent',
      coupon_applied: data.couponId || null,
      stripe_invoice_url: finalized.hosted_invoice_url,
      stripe_invoice_pdf: finalized.invoice_pdf,
    });
  }

  revalidatePath('/dashboard/invoices');
  return { success: true };
}

export async function markCashPaid(invoiceId: string) {
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from('agency_invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', invoiceId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/invoices');
}

export async function voidInvoice(invoiceId: string) {
  const adminSupabase = createAdminClient();
  const { data: inv } = await adminSupabase
    .from('agency_invoices')
    .select('stripe_invoice_id, stripe_subscription_id')
    .eq('id', invoiceId)
    .single();

  if (inv?.stripe_invoice_id) {
    await stripe.invoices.voidInvoice(inv.stripe_invoice_id).catch(() => {});
  }
  if (inv?.stripe_subscription_id) {
    await stripe.subscriptions.cancel(inv.stripe_subscription_id).catch(() => {});
  }

  await adminSupabase
    .from('agency_invoices')
    .update({ status: 'void' })
    .eq('id', invoiceId);

  revalidatePath('/dashboard/invoices');
}

// ── COUPONS ───────────────────────────────────────────────────────────────────

export async function createCoupon(data: {
  name: string;
  percentOff?: number;
  amountOffCents?: number;
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
}) {
  const tenantId = await getAgencyTenantId();
  const adminSupabase = createAdminClient();

  const couponParams: Stripe.CouponCreateParams = {
    name: data.name,
    duration: data.duration,
    ...(data.percentOff ? { percent_off: data.percentOff } : {}),
    ...(data.amountOffCents ? { amount_off: data.amountOffCents, currency: 'usd' } : {}),
    ...(data.duration === 'repeating' && data.durationInMonths
      ? { duration_in_months: data.durationInMonths }
      : {}),
  };

  const stripeCoupon = await stripe.coupons.create(couponParams);

  const { error } = await adminSupabase.from('agency_coupons').insert({
    agency_tenant_id: tenantId,
    name: data.name,
    stripe_coupon_id: stripeCoupon.id,
    percent_off: data.percentOff || null,
    amount_off_cents: data.amountOffCents || null,
    duration: data.duration,
    duration_in_months: data.durationInMonths || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/invoices/promotions');
}

export async function toggleCoupon(couponId: string, active: boolean) {
  const adminSupabase = createAdminClient();
  await adminSupabase
    .from('agency_coupons')
    .update({ active })
    .eq('id', couponId);
  revalidatePath('/dashboard/invoices/promotions');
}
