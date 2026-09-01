"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const getCleanSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const supabaseUrl = getCleanSupabaseUrl()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  
  const formSectionRef = useRef(null)

  useEffect(() => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      // Send the reset email and tell Supabase where to redirect the user afterward
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) throw error

      setSuccessMsg("Check your email! We've sent you a link to reset your password.")
    } catch (err) {
      setErrorMsg(err.message || "Failed to send reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 w-full h-full z-0 bg-stone-950 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-stone-950 to-stone-950 z-1"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] z-1"></div>
      </div>

      {/* Simplified Header for Auth Pages */}
      <header className="relative max-w-7xl mx-auto w-full px-6 py-6 border-b border-stone-900/60 z-20 backdrop-blur-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="h-11 w-11 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg overflow-hidden shrink-0 relative">
            <span className="text-[11px] font-bold text-white tracking-tighter lowercase font-sans absolute">project</span>
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
            Project Find
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative flex-grow flex items-center justify-center z-10 py-12 px-6">
        <div ref={formSectionRef} className="max-w-xl w-full bg-gradient-to-b from-stone-950/95 to-stone-950/100 border border-stone-850/80 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col justify-center">
          <h1 className="text-3xl font-black text-white mb-2">Reset Password</h1>
          <p className="text-stone-300 text-sm font-medium mb-8">
            Remembered your password?{' '}
            <button onClick={() => router.push('/login')} className="text-amber-400 hover:underline font-bold">
              Back to login
            </button>
          </p>

          {errorMsg && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center space-y-3">
              <h3 className="text-xl font-bold text-green-400">Email Sent</h3>
              <p className="text-stone-300 text-sm font-medium">{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                />
              </div>

              <div className="text-xs text-stone-400 font-medium leading-relaxed pt-1">
                We'll send a secure, encrypted link to this email address to reset your credentials.
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-500 text-stone-950 font-extrabold rounded-2xl shadow-xl shadow-amber-600/10 transition transform hover:-translate-y-0.5 active:scale-95 text-center text-sm"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative border-t border-stone-900/60 py-8 text-center text-xs text-stone-300 font-medium z-10 backdrop-blur-sm">
        <p>© 2026 Project Find. All rights reserved.</p>
      </footer>
    </div>
  )
}