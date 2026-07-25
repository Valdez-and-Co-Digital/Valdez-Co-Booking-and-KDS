import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { stripe, calculatePlatformFee } from '@/lib/stripe/server';
import type { CartItem } from '@/types/database';

interface CreatePaymentIntentBody {
  tenantId: string;
  cartItems: CartItem[];
  customerEmail: string;
  customerName: string;
}

export async function POST(req: Request) {
  try {
    const body: CreatePaymentIntentBody = await req.json();
    const { tenantId, cartItems, customerEmail, customerName } = body;

    if (!tenantId || !cartItems?.length || !customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch tenant from DB (validates tenant exists and has Stripe connected)
    const supabase = createServerClient();
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, stripe_account_id, settings, name')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!tenant.stripe_account_id) {
      return NextResponse.json(
        { error: 'This business has not connected their payment account yet.' },
        { status: 400 }
      );
    }

    // Calculate total server-side (never trust client-side totals)
    // Note: We re-fetch service prices from DB for security in production
    const totalCents = cartItems.reduce(
      (sum, item) => sum + item.price_cents * item.quantity,
      0
    );

    if (totalCents < 50) {
      return NextResponse.json(
        { error: 'Order total must be at least $0.50' },
        { status: 400 }
      );
    }

    const applicationFeeAmount = calculatePlatformFee(totalCents);
    const currency = (tenant.settings as any)?.currency ?? 'usd';

    // Create Stripe PaymentIntent with Destination Charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency,
      automatic_payment_methods: { enabled: true },
      // Destination Charge: funds go to connected account, platform keeps fee
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: tenant.stripe_account_id,
      },
      // Required for cross-region compliance + correct statement descriptor
      on_behalf_of: tenant.stripe_account_id,
      receipt_email: customerEmail,
      description: `SwiftKDS booking at ${tenant.name}`,
      metadata: {
        tenant_id: tenantId,
        tenant_name: tenant.name,
        customer_name: customerName,
        customer_email: customerEmail,
        cart_items: JSON.stringify(cartItems.map(i => ({ name: i.name, qty: i.quantity }))),
        powered_by: 'SwiftKDS — a Valdez & Co. product',
      },
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: totalCents,
      platform_fee: applicationFeeAmount,
    });
  } catch (err: any) {
    console.error('[create-intent] Error:', err);
    return NextResponse.json(
      { error: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
