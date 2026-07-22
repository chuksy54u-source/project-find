"use client"
import CheckoutClient from './CheckoutClient'

export default function CheckoutPage() {
  return <CheckoutClient />
}
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

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
  const [PaystackHook, setPaystackHook] = useState(null)

  const paymentAmountInNaira = 3000
  const paymentAmountInKobo = paymentAmountInNaira * 100

  // 1. Dynamically import react-paystack ONLY on the client after mount
  useEffect(() => {
    import('react-paystack').then((mod) => {
      setPaystackHook(() => mod.usePaystackPayment)
    }).catch(err => console.error("Failed to load Paystack:", err))
  }, [])

  // 2. Auth and Profile Check
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

  const handleStartPayment = async (e) => {
    e.preventDefault()

    if (!PaystackHook) {
      alert("Payment gateway is loading, please try again in a second.")
      return
    }

    setProcessing(true)

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

    // Call Paystack directly on click
    try {
      const initializePayment = PaystackHook(paystackConfig)

      const handleSuccess = async (reference) => {
  try {
    const res = await fetch('/api/paystack/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: reference.reference,
        userId: user.id,
        userEmail: user.email,
        userName: profileData?.full_name,
        amount: paymentAmountInNaira
      })
    })

    const data = await res.json()

    if (res.ok && data.success) {
      router.push('/checkout/success')
    } else {
      alert(`Payment received, but database update failed: ${data.error}`)
    }
  } catch (err) {
    console.error("Verification request error:", err)
    alert("Payment verification failed. Please contact support.")
  } finally {
    setProcessing(false)
  }
}

      initializePayment(handleSuccess, handleClose)
    } catch (err) {
      console.error("Paystack launch error:", err)
      setProcessing(false)
    }
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

        <div className="bg-stone-950 p-6 rounded-2xl border border-amber-500/20 text-center space-y-2 mb-6">
          <span className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold">Total Amount</span>
          <p className="text-3xl font-black text-amber-500">₦3,000</p>
          <span className="inline-block text-[11px] text-stone-400 bg-stone-900 px-3 py-1 rounded-full border border-stone-800 font-medium">
            Account Email: <strong className="text-stone-200">{user?.email}</strong>
          </span>
        </div>

        <button 
          onClick={handleStartPayment}
          disabled={processing}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
        >
          {processing ? 'Processing Payment...' : 'Pay ₦3,000 with Paystack'}
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