import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // In production: Verify webhook signature here using process.env.HELCIM_WEBHOOK_SECRET
    // Example:
    // const signature = request.headers.get('helcim-signature');
    // if (!isValidSignature(payload, signature)) return new Response('Invalid', { status: 401 });

    // Check event type (this may vary by Helcim API version, e.g. "transaction.approved")
    if (payload.event === 'transaction.approved' || payload.status === 'APPROVED') {
      const invoiceNumber = payload.invoiceNumber;
      const transactionId = payload.transactionId;

      if (!invoiceNumber) {
        return NextResponse.json({ error: 'Missing invoiceNumber' }, { status: 400 });
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // 1. Look up invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceNumber)
        .single();

      if (invoiceError || !invoice) {
        console.error('Invoice not found:', invoiceNumber);
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // 2. Mark invoice paid
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          helcim_transaction_id: transactionId,
          paid_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      // 3. Advance prospect pipeline if applicable
      if (invoice.prospect_id) {
        await supabase
          .from('prospects')
          .update({
            status: 'converted',
            converted_invoice_id: invoice.id
          })
          .eq('id', invoice.prospect_id);
          
        await supabase
          .from('prospect_notes')
          .insert({
            prospect_id: invoice.prospect_id,
            note_text: `System: Invoice paid (Tx: ${transactionId}). Prospect automatically converted.`
          });
      }

      return NextResponse.json({ success: true });
    }

    // Ignore other events
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Helcim webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
