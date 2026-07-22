"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Clean up environment variables safely to prevent trailing slash errors
const getCleanSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

// Initialize the Supabase Client
const supabaseUrl = getCleanSupabaseUrl()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Ref to target the exact form container where user details are entered
  const formSectionRef = useRef(null)

  // Automatically scroll down to the login form box on page load for both mobile and PC
  useEffect(() => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const handleNavigation = (path) => {
    setIsMobileMenuOpen(false)
    router.push(path)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      // 1. Sign in user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      // 2. Sync with profiles table and fetch full_name, is_super_admin, is_admin, is_staff, and is_crm
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, is_super_admin, is_admin, is_staff, is_crm')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.error("Profile sync error on login:", profileError)
      }

      // 3. Welcome message and role-based redirection routing
      const displayName = profile?.full_name || 'User'
      const isSuperAdminUser = profile?.is_super_admin === true
      const isAdminUser = profile?.is_admin === true
      const isStaffUser = profile?.is_staff === true
      const isCrmUser = profile?.is_crm === true

      if (isSuperAdminUser) {
        setSuccessMsg(`Welcome, Super Administrator ${displayName}! Redirecting to Super Admin Page...`)
        setTimeout(() => {
          router.push('/super-admin')
        }, 1500)
      } else if (isAdminUser) {
        setSuccessMsg(`Welcome, Administrator ${displayName}! Redirecting to Admin Panel...`)
        setTimeout(() => {
          router.push('/admin')
        }, 1500)
      } else if (isStaffUser) {
        setSuccessMsg(`Welcome, Staff Member ${displayName}! Redirecting to Staff Dashboard...`)
        setTimeout(() => {
          router.push('/staff')
        }, 1500)
      } else if (isCrmUser) {
        setSuccessMsg(`Welcome, Representative ${displayName}! Redirecting to Customer Portal...`)
        setTimeout(() => {
          router.push('/crm')
        }, 1500)
      } else {
        setSuccessMsg(`Welcome back, ${displayName}! Redirecting to your dashboard...`)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      }

    } catch (err) {
      if (err.message?.includes("Email not confirmed")) {
        setErrorMsg("Please verify your email address before logging in.")
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
        }, 2000)
      } else {
        setErrorMsg(err.message || "Invalid email or password.")
      }
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

      {/* NAVIGATION HEADER */}
      <header className="relative max-w-7xl mx-auto w-full px-6 py-6 border-b border-stone-900/60 z-20 backdrop-blur-md">
        <div className="flex items-center justify-between gap-6">
          {/* Left Side Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigation('/')}>
            <div className="h-11 w-11 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg overflow-hidden shrink-0 relative">
              <span className="text-[11px] font-bold text-white tracking-tighter lowercase font-sans absolute">project</span>
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
              Project Find
            </span>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center justify-center gap-x-6 gap-y-2 text-sm font-bold text-stone-300">
            <button 
              onClick={() => handleNavigation('/')} 
              className="hover:text-amber-400 transition-colors duration-200"
            >
              Home
            </button>
            <button 
              onClick={() => handleNavigation('/#how-it-works')} 
              className="hover:text-amber-400 transition-colors duration-200"
            >
              How It Works
            </button>
            <button 
              onClick={() => handleNavigation('/faq')} 
              className="hover:text-amber-400 transition-colors duration-200"
            >
              FAQ
            </button>
            <button 
              onClick={() => handleNavigation('/about')} 
              className="hover:text-amber-400 transition-colors duration-200"
            >
              About Us
            </button>
            <button 
              onClick={() => handleNavigation('/privacy')} 
              className="hover:text-amber-400 transition-colors duration-200"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => handleNavigation('/contact')} 
              className="hover:text-amber-400 transition-colors duration-200"
            >
              Contact Us
            </button>
          </nav>

          {/* Right Side Actions / Mobile Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-3">
              <button 
                onClick={() => handleNavigation('/login')}
                className="px-5 py-2.5 bg-stone-900/90 text-amber-400 text-sm font-semibold rounded-xl border border-amber-500/20 backdrop-blur transition shadow-md"
              >
                Log In
              </button>
              <button 
                onClick={() => handleNavigation('/register')}
                className="px-5 py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-stone-800/80 flex flex-col space-y-3 bg-stone-950/95 p-4 rounded-2xl border backdrop-blur-lg">
            <button 
              onClick={() => handleNavigation('/')} 
              className="text-left py-2 px-3 text-stone-200 hover:text-amber-400 font-semibold text-sm rounded-lg hover:bg-stone-900"
            >
              Home
            </button>
            <button 
              onClick={() => handleNavigation('/#how-it-works')} 
              className="text-left py-2 px-3 text-stone-200 hover:text-amber-400 font-semibold text-sm rounded-lg hover:bg-stone-900"
            >
              How It Works
            </button>
            <button 
              onClick={() => handleNavigation('/faq')} 
              className="text-left py-2 px-3 text-stone-200 hover:text-amber-400 font-semibold text-sm rounded-lg hover:bg-stone-900"
            >
              FAQ
            </button>
            <button 
              onClick={() => handleNavigation('/about')} 
              className="text-left py-2 px-3 text-stone-200 hover:text-amber-400 font-semibold text-sm rounded-lg hover:bg-stone-900"
            >
              About Us
            </button>
            <button 
              onClick={() => handleNavigation('/privacy')} 
              className="text-left py-2 px-3 text-stone-200 hover:text-amber-400 font-semibold text-sm rounded-lg hover:bg-stone-900"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => handleNavigation('/contact')} 
              className="text-left py-2 px-3 text-stone-200 hover:text-amber-400 font-semibold text-sm rounded-lg hover:bg-stone-900"
            >
              Contact Us
            </button>

            {/* Mobile Action Buttons inside Drawer */}
            <div className="pt-3 border-t border-stone-800/60 grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleNavigation('/login')}
                className="w-full py-2.5 bg-stone-900 text-amber-400 text-sm font-semibold rounded-xl border border-amber-500/20 text-center"
              >
                Log In
              </button>
              <button 
                onClick={() => handleNavigation('/register')}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 text-center"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* LOGIN MAIN CONTENT */}
      <main className="relative flex-grow flex items-center justify-center z-10 py-12 px-6">
        <div ref={formSectionRef} className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Picture Cover & Pitch Panel */}
          <div className="lg:col-span-5 rounded-3xl overflow-hidden border border-stone-900/85 shadow-2xl relative min-h-[350px] lg:min-h-auto flex flex-col justify-end p-8 group">
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop" 
              alt="Premium modern workspace window view" 
              className="absolute inset-0 w-full h-full object-cover brightness-[0.4] contrast-[1.05] filter saturate-[0.8] transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent z-1"></div>

            {/* Panel Text Elements */}
            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 backdrop-blur-md">
                Encrypted Sessions
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Unlock your customized career tracking.
              </h2>
              <p className="text-stone-300 font-medium text-xs sm:text-sm leading-relaxed">
                Welcome back! Log in with your registered credentials to access secure portals, check application pipelines, and complete checkout processes.
              </p>
            </div>
          </div>

          {/* Right Column: Login Form Card */}
          <div className="lg:col-span-7 bg-gradient-to-b from-stone-950/95 to-stone-950/100 border border-stone-850/80 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col justify-center">
            <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
            <p className="text-stone-300 text-sm font-medium mb-8">
              New to the platform?{' '}
              <button onClick={() => router.push('/register')} className="text-amber-400 hover:underline font-bold">
                Create an account
              </button>
            </p>

            {/* Error Message banner */}
            {errorMsg && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Success Message banner */}
            {successMsg ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center space-y-3 animate-pulse">
                <h3 className="text-xl font-bold text-green-400">Authenticated</h3>
                <p className="text-stone-300 text-sm font-medium">{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Email field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="name@example.com" 
                    className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>

                {/* Password field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-300">Password</label>
                    <button 
                      type="button" 
                      onClick={() => alert("Password recovery flows can be configured inside your Supabase dashboard.")} 
                      className="text-xs text-amber-400 hover:underline font-bold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>

                <div className="text-xs text-stone-400 font-medium leading-relaxed pt-1">
                  Secure login utilizes encrypted session cookies protected under standard Supabase Auth policies. 
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-500 text-stone-950 font-extrabold rounded-2xl shadow-xl shadow-amber-600/10 transition transform hover:-translate-y-0.5 active:scale-95 text-center text-sm"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                </button>
              </form>
            )}

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative border-t border-stone-900/60 py-8 text-center text-xs text-stone-300 font-medium z-10 backdrop-blur-sm">
        <p>© 2026 Project Find. All rights reserved. Simplifying careers, one applicant at a time.</p>
      </footer>

    </div>
  )
}