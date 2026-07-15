"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Retrieve email from URL query parameter if available (e.g., /verify-email?email=user@example.com)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const emailParam = params.get('email')
      if (emailParam) {
        setEmail(emailParam)
      }
    }
  }, [])

  const handleResend = async (e) => {
    e.preventDefault()
    if (!email) {
      setErrorMsg("Please enter your email address to resend the verification link.")
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      })

      if (error) throw error

      setSuccessMsg("A fresh verification link has been sent to your email address!")
    } catch (err) {
      setErrorMsg(err.message || "Failed to resend the verification email.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 w-full h-full z-0 bg-stone-950">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-stone-950 to-stone-950 z-1"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] z-1"></div>
      </div>

      {/* 🧭 NAVIGATION HEADER */}
      <header className="relative max-w-7xl mx-auto w-full px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-900/60 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="h-11 w-11 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg overflow-hidden shrink-0 relative">
            <span className="text-[11px] font-bold text-white tracking-tighter lowercase font-sans absolute">project</span>
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
            Project Find
          </span>
        </div>

        <nav className="flex items-center space-x-8 text-sm font-bold text-stone-300">
          <button onClick={() => router.push('/')} className="hover:text-amber-400 transition-colors duration-200">Home</button>
          <button onClick={() => router.push('/about')} className="hover:text-amber-400 transition-colors duration-200">About Us</button>
          <button onClick={() => router.push('/contact')} className="hover:text-amber-400 transition-colors duration-200">Contact Us</button>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/login')}
            className="px-5 py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md"
          >
            Log In
          </button>
          <button 
            onClick={() => router.push('/register')}
            className="px-5 py-2.5 bg-stone-900/90 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* 🚀 VERIFY EMAIL CONTENT */}
      <main className="relative flex-grow flex items-center justify-center z-10 py-16 px-6">
        <div className="max-w-md w-full bg-gradient-to-b from-stone-950/95 to-stone-950/100 border border-stone-850/80 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-6">
          
          {/* Animated Email Icon Wrapper */}
          <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
            ✉️
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Verify your email</h1>
            <p className="text-stone-300 text-sm font-medium leading-relaxed">
              We've sent a magic verification link to your registered email address. Please open it to activate your profile.
            </p>
          </div>

          {/* Highlighted Email Display */}
          {email && (
            <div className="bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-2.5 inline-block text-xs font-semibold text-amber-400 tracking-wide font-mono">
              {email}
            </div>
          )}

          {/* Status Message Banners */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-xs text-green-400 font-semibold animate-pulse">
              🎉 {successMsg}
            </div>
          )}

          {/* Prompt to Resend Verification */}
          <form onSubmit={handleResend} className="pt-4 border-t border-stone-900/60 space-y-4">
            <div className="text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">Didn't get the email?</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Confirm your email address" 
                className="w-full bg-stone-900/40 border border-stone-900 rounded-xl px-4 py-2.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition font-medium"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-stone-900/90 hover:bg-stone-850 disabled:bg-stone-900 text-stone-200 text-xs font-bold rounded-xl border border-stone-800 transition duration-150 active:scale-95 shadow-md"
            >
              {loading ? 'Resending Link...' : 'Resend Verification Email'}
            </button>
          </form>

          {/* Button to navigate directly back to Login page */}
          <div className="pt-2">
            <button 
              onClick={() => router.push('/login')}
              className="text-amber-400 hover:text-amber-300 font-bold text-sm transition underline underline-offset-4"
            >
              Return to Login page
            </button>
          </div>

        </div>
      </main>

      {/* 👣 FOOTER */}
      <footer className="relative border-t border-stone-900/60 py-8 text-center text-xs text-stone-300 font-medium z-10 backdrop-blur-sm">
        <p>© 2026 Project Find. All rights reserved. Simplifying careers, one applicant at a time.</p>
      </footer>

    </div>
  )
}