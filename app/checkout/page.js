"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { usePaystackPayment } from 'react-paystack'

const getCleanSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const supabaseUrl = getCleanSupabaseUrl()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function CheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState(null)
  const [profileData, setProfileData] = useState(null)

  const paymentAmountInNaira = 3000
  const paymentAmountInKobo = paymentAmountInNaira * 100 // Paystack expects amounts in Kobo

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }
      setUser(authUser)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, payment_status')
        .eq('id', authUser.id)
        .single()

      if (profile?.payment_status === 'paid') {
        router.push('/dashboard')
        return
      }

      setProfileData(profile)
      setLoading(false)
    }
    checkSession()
  }, [router])

  // Paystack Configuration
  const paystackConfig = {
    reference: `PF_${user?.id?.substring(0, 5)}_${new Date().getTime()}`,
    email: user?.email || '',
    amount: paymentAmountInKobo,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    metadata: {
      custom_fields: [
        {
          display_name: "Full Name",
          variable_name: "full_name",
          value: profileData?.full_name || user?.email,
        }
      ]
    }
  }

  const initializePayment = usePaystackPayment(paystackConfig)

  // Success Callback
  const handlePaystackSuccess = async (reference) => {
    setProcessing(true)

    try {
      // 1. Insert record into payments table marked as 'approved'
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          sender_name: profileData?.full_name || user.email,
          amount: paymentAmountInNaira,
          receipt_url: `paystack_ref:${reference.reference}`,
          status: 'approved'
        })

      if (paymentError) throw paymentError

      // 2. Update profiles table payment_status column to 'paid'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ payment_status: 'paid' })
        .eq('id', user.id)

      if (profileError) throw profileError

      // 3. Redirect to Checkout Success Page
      router.push('/checkout/success')
    } catch (err) {
      console.error("Database update error:", err)
      alert("Payment was processed, but updating your account profile encountered an error. Please contact support.")
    } finally {
      setProcessing(false)
    }
  }

  // Close Callback
  const handlePaystackClose = () => {
    setProcessing(false)
  }

  const handleStartPayment = (e) => {
    e.preventDefault()
    setProcessing(true)
    initializePayment(handlePaystackSuccess, handlePaystackClose)
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans relative overflow-x-hidden flex flex-col items-center justify-center p-6">
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1800&auto=format&fit=crop" 
          alt="Workspace backdrop"
          className="w-full h-full object-cover brightness-60" 
        />
        <div className="absolute inset-0 bg-stone-950/90" />
      </div>

      <div className="relative z-10 max-w-md w-full bg-stone-900/50 backdrop-blur-xl border border-stone-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-white mb-2">Complete Verification</h1>
        <p className="text-stone-400 text-xs mb-6 font-medium">
          Pay via card, bank transfer, or USSD using Paystack to activate your profile dashboard instantly.
        </p>

        {/* Payment Summary Box */}
        <div className="bg-stone-950 p-6 rounded-2xl border border-amber-500/20 text-center space-y-2 mb-6">
          <span className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold">Total Amount</span>
          <p className="text-3xl font-black text-amber-500">₦3,000</p>
          <span className="inline-block text-[11px] text-stone-400 bg-stone-900 px-3 py-1 rounded-full border border-stone-800 font-medium">
            Account Email: <strong className="text-stone-200">{user?.email}</strong>
          </span>
        </div>

        {/* Paystack Pay Button */}
        <button 
          onClick={handleStartPayment}
          disabled={processing}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
        >
          {processing ? (
            <span>Processing Payment...</span>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Pay ₦3,000 with Paystack</span>
            </>
          )}
        </button>

        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 mt-3 text-stone-500 text-xs font-bold hover:text-white transition text-center"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}