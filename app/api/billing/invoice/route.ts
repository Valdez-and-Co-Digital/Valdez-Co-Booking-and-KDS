import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { prospectId, tier } = await request.json();

    if (!prospectId || !tier) {
      return NextResponse.json({ error: 'prospectId and tier are required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch prospect
    const { data: prospect, error: fetchError } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (fetchError || !prospect) {
      throw new Error('Prospect not found');
    }

    // Fetch tier config
    const { data: tierConfig, error: tierError } = await supabase
      .from('tier_configs')
      .select('*')
      .eq('id', tier)
      .single();

    if (tierError || !tierConfig) {
      throw new Error('Tier config not found');
    }

    // 1. Create Invoice in DB
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: 'a0000000-0000-0000-0000-000000000001', // Using a default admin tenant id for agency
        prospect_id: prospect.id,
        amount_cents: tierConfig.price_cents,
        description: tierConfig.description,
        status: 'open',
        tier_id: tierConfig.id
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Failed to create invoice');
    }

    // 2. Call Helcim's HelcimPay.js initialize endpoint
    // In production, uncomment the real API call
    /*
    const helcimRes = await fetch('https://api.helcim.com/v2/helcim-pay/initialize', {
      method: 'POST',
      headers: {
        'api-token': process.env.HELCIM_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentType: 'purchase',
        amount: (tierConfig.price_cents / 100).toFixed(2),
        currency: 'USD',
        invoiceNumber: invoice.id,
      })
    });
    const helcimData = await helcimRes.json();
    const checkoutToken = helcimData.checkoutToken;
    */
    
    const mockCheckoutToken = `chk_${Math.random().toString(36).substring(7)}`;

    // 3. Store checkoutToken on the invoice record
    await supabase
      .from('invoices')
      .update({ checkout_token: mockCheckoutToken })
      .eq('id', invoice.id);

    // 4. Update prospect tier
    await supabase
      .from('prospects')
      .update({ tier_selected: tier })
      .eq('id', prospect.id);

    // 5. "Email the client the pay link" (add to notes)
    await supabase
      .from('prospect_notes')
      .insert({
        prospect_id: prospect.id,
        note_text: `System: Sent email with web link demo for tier ${tierConfig.name}. Pay Link: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${invoice.id}`
      });

    return NextResponse.json({ 
      success: true, 
      invoiceId: invoice.id,
      checkoutToken: mockCheckoutToken,
      amount: tierConfig.price_cents / 100,
      description: tierConfig.description
    });

  } catch (error: any) {
    console.error('Invoice generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
