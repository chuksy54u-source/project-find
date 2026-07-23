import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  try {
    const { reference, userId, userEmail, userName, amount } = await req.json()

    if (!reference || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    // Ensure environment variables are loaded on the server
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing' }, { status: 500 })
    }

    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Server configuration error: PAYSTACK_SECRET_KEY is missing' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    // 1. Verify transaction with Paystack API
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    })

    const paystackData = await paystackRes.json()

    if (!paystackData.status || paystackData.data?.status !== 'success') {
      return NextResponse.json({ 
        error: paystackData.message || 'Payment verification failed on Paystack' 
      }, { status: 400 })
    }

    // 2. Insert into payments table
    const { error: paymentErr } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        sender_name: userName || userEmail || 'Unknown User',
        amount: Number(amount) || 3000,
        receipt_url: `paystack_ref:${reference}`,
        status: 'approved'
      })

    if (paymentErr) {
      console.error("Payment insert error:", paymentErr)
      return NextResponse.json({ error: `Database error (payments): ${paymentErr.message}` }, { status: 500 })
    }

    // 3. Update payment_status on profiles table
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update({ payment_status: 'paid' })
      .eq('id', userId)

    if (profileErr) {
      console.error("Profile update error:", profileErr)
      return NextResponse.json({ error: `Database error (profiles): ${profileErr.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Payment recorded and verified successfully' })

  } catch (error) {
    console.error("Verification endpoint error:", error)
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}