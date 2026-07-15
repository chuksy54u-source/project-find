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
        
        {/* Animated Check/Hourglass Icon */}
        <div className="mx-auto h-16 w-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center relative">
          <span className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-75"></span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            Proof Submitted Successfully
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">Payment Under Review</h1>
          <p className="text-stone-400 text-xs mt-2 leading-relaxed">
            We have securely received your receipt screenshot. Our administration team is cross-checking the OPay transfer.
          </p>
        </div>

        {/* Informative Status Details */}
        <div className="bg-stone-950 p-5 rounded-2xl border border-stone-850 text-left space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">Amount Sent:</span>
            <span className="font-bold text-white">₦3,000</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-stone-500">Target Account:</span>
            <span className="font-bold text-white">Igbozurike Kizito (OPay)</span>
          </div>
          <div className="flex justify-between text-xs pt-3 border-t border-stone-900">
            <span className="text-stone-500">Estimated Verification Time:</span>
            <span className="font-bold text-amber-400">Within 24 Hours</span>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="relative pt-2">
          <div className="flex mb-2 items-center justify-between">
            <div className="text-right">
              <span className="text-[10px] font-bold inline-block text-amber-500 uppercase tracking-widest">
                Step 2 of 3: Manual Verification
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-1.5 text-xs flex rounded bg-stone-950 border border-stone-900">
            <div style={{ width: "66%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500 transition-all duration-500"></div>
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
            Your premium features will automatically unlock once confirmation completes. If you have any questions, reach out with your transaction receipt.
          </p>
        </div>
      </div>
    </div>
  )
}