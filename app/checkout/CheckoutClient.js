"use client"

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

export default function CheckoutClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState(null)
  const [profileData, setProfileData] = useState(null)

  const paymentAmountInNaira = 3000
  const paymentAmountInKobo = paymentAmountInNaira * 100

  // 1. Auth & Session Check
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

  // 2. Open Paystack Native Popup Modal
  const openPaystackModal = () => {
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user?.email,
      amount: paymentAmountInKobo,
      ref: `PF_${user?.id?.substring(0, 5)}_${new Date().getTime()}`,
      metadata: {
        custom_fields: [
          {
            display_name: "Full Name",
            variable_name: "full_name",
            value: profileData?.full_name || user?.email || '',
          }
        ]
      },
      callback: function (response) {
        handlePaystackSuccess(response)
      },
      onClose: function () {
        setProcessing(false)
      }
    })
    handler.openIframe()
  }

  // 3. Call Backend Verification API Route
  const handlePaystackSuccess = async (response) => {
    try {
      const refString = typeof response === 'object' ? response.reference : response

      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: refString,
          userId: user.id,
          userEmail: user.email,
          userName: profileData?.full_name || user.email,
          amount: paymentAmountInNaira
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        router.push('/checkout/success')
      } else {
        alert(`Payment verification error:\n${data.error || 'Failed to update database'}`)
      }
    } catch (err) {
      console.error("Verification error:", err)
      alert("Could not reach verification server. Please check your network connection.")
    } finally {
      setProcessing(false)
    }
  }

  // 4. Start Payment Flow
  const handleStartPayment = (e) => {
    e.preventDefault()

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

    if (!publicKey || publicKey.trim() === '') {
      alert("Paystack Public Key is missing!\n\n1. Ensure NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is set in your .env.local file.\n2. Restart your dev server (npm run dev).")
      return
    }

    setProcessing(true)

    // Load Paystack Inline JS script dynamically if not loaded yet
    if (typeof window !== 'undefined' && window.PaystackPop) {
      openPaystackModal()
    } else {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => openPaystackModal()
      script.onerror = () => {
        setProcessing(false)
        alert("Failed to load Paystack popup. Check your internet connection or disable ad-blockers/extensions.")
      }
      document.body.appendChild(script)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-amber-500 font-bold">
        Loading Checkout...
      </div>
    )
  }

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