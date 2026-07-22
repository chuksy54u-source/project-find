import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Corrected: Admin Supabase client using the actual Service Role Key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // <-- Changed this from ANON_KEY
)

export async function POST(req) {
  try {
    const { reference, userId, userEmail, userName, amount } = await req.json()

    if (!reference || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 1. Verify transaction with Paystack API
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ error: 'Payment verification failed on Paystack' }, { status: 400 })
    }

    // 2. Insert into payments table
    const { error: paymentErr } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        sender_name: userName || userEmail,
        amount: amount,
        receipt_url: `paystack_ref:${reference}`,
        status: 'approved'
      })

    if (paymentErr) {
      console.error("Payment insert error:", paymentErr)
      return NextResponse.json({ error: paymentErr.message }, { status: 500 })
    }

    // 3. Update payment_status on profiles table
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update({ payment_status: 'paid' })
      .eq('id', userId)

    if (profileErr) {
      console.error("Profile update error:", profileErr)
      return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Payment recorded and verified successfully' })

  } catch (error) {
    console.error("Verification endpoint error:", error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}