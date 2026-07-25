import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Stripe Terminal Connection Token endpoint.
 * Called by the Stripe Terminal SDK to authenticate a reader session.
 * The token is tied to the tenant's Stripe Connect account.
 */
export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the tenant's connected Stripe account
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('tenant_id, tenants(stripe_account_id)')
      .eq('user_id', session.user.id)
      .single();

    const stripeAccountId = (adminUser?.tenants as any)?.stripe_account_id;

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: 'No Stripe account connected to this tenant' },
        { status: 400 }
      );
    }

    // Create a connection token scoped to the connected account
    const connectionToken = await stripe.terminal.connectionTokens.create(
      {},
      { stripeAccount: stripeAccountId }
    );

    return NextResponse.json({ secret: connectionToken.secret });
  } catch (err: any) {
    console.error('[connection-token] Error:', err);
    return NextResponse.json(
      { error: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
