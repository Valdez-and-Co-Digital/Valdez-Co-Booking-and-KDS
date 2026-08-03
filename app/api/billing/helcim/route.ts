import { NextResponse } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { prospectId } = await request.json();

    if (!prospectId) {
      return NextResponse.json({ error: 'prospectId is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // --- MOCK HELCIM BILLING LOGIC ---
    // In a real implementation, you would:
    // 1. Call Helcim Customer API to create a customer record.
    // 2. Return the Helcim Customer ID to the frontend to load HelcimPay.js for card capture.
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockCustomerId = `CST-${Math.floor(Math.random() * 1000000)}`;

    // Update prospect in DB
    const { error: updateError } = await supabase
      .from('prospects')
      .update({
        helcim_customer_id: mockCustomerId,
      })
      .eq('id', prospectId);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      customerId: mockCustomerId,
      message: 'Mock billing profile created.'
    });

  } catch (error: any) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { error: 'Failed to setup billing' },
      { status: 500 }
    );
  }
}
