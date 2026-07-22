"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const getCleanSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const supabaseUrl = getCleanSupabaseUrl()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }
      setUser(authUser)
      setLoading(false)
    }
    checkSession()
  }, [router])

  if (loading) return null

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans relative overflow-x-hidden flex flex-col items-center justify-center p-6">
      {/* Visual Background */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1800&auto=format&fit=crop" 
          className="w-full h-full object-cover brightness-60" 
          alt="Premium textured background"
        />
        <div className="absolute inset-0 bg-stone-950/90" />
      </div>

      <div className="relative z-10 max-w-md w-full bg-stone-900/50 backdrop-blur-xl border border-stone-800 rounded-3xl p-8 text-center shadow-2xl space-y-6">
        
        {/* Animated Green Checkmark Icon */}
        <div className="mx-auto h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center relative">
          <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75"></span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            Payment Verified
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">Payment Successful!</h1>
          <p className="text-stone-400 text-xs mt-2 leading-relaxed">
            Your transaction has been securely processed via Paystack. Your access has been activated automatically.
          </p>
        </div>

        {/* Informative Status Details */}
        <div className="bg-stone-950 p-5 rounded-2xl border border-stone-850 text-left space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">Amount Paid:</span>
            <span className="font-bold text-white">₦3,000</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">Payment Gateway:</span>
            <span className="font-bold text-white">Paystack</span>
          </div>
          <div className="flex justify-between text-xs pt-3 border-t border-stone-900">
            <span className="text-stone-500">Account Status:</span>
            <span className="font-bold text-emerald-400 uppercase tracking-wide">Active / Paid</span>
          </div>
        </div>

        {/* Complete Progress Bar */}
        <div className="relative pt-2">
          <div className="flex mb-2 items-center justify-between">
            <div className="text-right">
              <span className="text-[10px] font-bold inline-block text-emerald-500 uppercase tracking-widest">
                Step 3 of 3: Access Granted
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-1.5 text-xs flex rounded bg-stone-950 border border-stone-900">
            <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"></div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/5"
          >
            Go to Dashboard
          </button>
          
          <p className="text-[10px] text-stone-500 leading-normal">
            A receipt has been sent to your registered email address. You can now access all features immediately.
          </p>
        </div>
      </div>
    </div>
  )
}