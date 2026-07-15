"use client"

import { useState } from 'react'
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

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', sector: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      // 1. Sign up the user in Supabase Auth with custom redirect back to the login page
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: 'https://www.project-find.online/login', // Redirects here after email confirmation
          data: {
            full_name: formData.name,
            phone_number: formData.phone,
          }
        }
      })

      if (authError) throw authError

      // 2. If the user is successfully created in auth, insert into your public.profiles table
      if (authData?.user) {
        // Map the single sector choice into your Postgres _text (array) column: ['Selected Sector']
        const interestsArray = formData.sector ? [formData.sector] : []

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              full_name: formData.name,
              email: formData.email,
              phone_number: formData.phone,
              interests: interestsArray, // Matches your _text schema beautifully!
              payment_status: 'unpaid'    // Optional field tracking payment status
            }
          ])

        if (profileError) throw profileError
      }

      setSuccessMsg("Success! Directing you to verify your email address...")
      
      // Save the email we need before clearing state
      const targetEmail = formData.email
      setFormData({ name: '', email: '', password: '', sector: '', phone: '' })
      
      // Redirect to the verify email page after brief delay
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(targetEmail)}`)
      }, 2000)

    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred during signup.")
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
      <header className="relative max-w-7xl mx-auto w-full px-6 py-6 flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-stone-900/60 z-10 backdrop-blur-md">
        {/* Left Side Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="h-11 w-11 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg overflow-hidden shrink-0 relative">
            <span className="text-[11px] font-bold text-white tracking-tighter lowercase font-sans absolute">project</span>
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
            Project Find
          </span>
        </div>

        {/* Center Navigation Tabs (Updated with all navigation items) */}
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-bold text-stone-300">
          <button 
            onClick={() => router.push('/')} 
            className="hover:text-amber-400 transition-colors duration-200"
          >
            Home
          </button>
          <button 
            onClick={() => router.push('/#how-it-works')} 
            className="hover:text-amber-400 transition-colors duration-200"
          >
            How It Works
          </button>
          <button 
            onClick={() => router.push('/faq')} 
            className="hover:text-amber-400 transition-colors duration-200"
          >
            FAQ
          </button>
          <button 
            onClick={() => router.push('/about')} 
            className="hover:text-amber-400 transition-colors duration-200"
          >
            About Us
          </button>
          <button 
            onClick={() => router.push('/privacy')} 
            className="hover:text-amber-400 transition-colors duration-200"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => router.push('/contact')} 
            className="hover:text-amber-400 transition-colors duration-200"
          >
            Contact Us
          </button>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/login')}
            className="px-5 py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md"
          >
            Log In
          </button>
          <button 
            onClick={() => router.push('/register')}
            className="px-5 py-2.5 bg-stone-900/90 text-amber-400 text-sm font-semibold rounded-xl border border-amber-500/20 backdrop-blur transition shadow-md"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* SIGN UP MAIN CONTENT */}
      <main className="relative flex-grow flex items-center justify-center z-10 py-12 px-6">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Picture Cover & Pitch Panel (5 Cols) */}
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
                Secure and Real-Time Syncing
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Your direct pipeline to verified placements.
              </h2>
              <p className="text-stone-300 font-medium text-xs sm:text-sm leading-relaxed">
                Provide your profile details to register. Once verified, your personalized profile dashboard syncs instantly to begin processing application pipelines.
              </p>
            </div>
          </div>

          {/* Right Column: Active Form Card (7 Cols) */}
          <div className="lg:col-span-7 bg-gradient-to-b from-stone-950/95 to-stone-950/100 border border-stone-850/80 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col justify-center">
            <h1 className="text-3xl font-black text-white mb-2">Create Your Profile</h1>
            <p className="text-stone-300 text-sm font-medium mb-8">
              Already have an account?{' '}
              <button onClick={() => router.push('/login')} className="text-amber-400 hover:underline font-bold">
                Log In
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
                <h3 className="text-xl font-bold text-green-400">Profile Initialized</h3>
                <p className="text-stone-300 text-sm font-medium">{successMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full Name field -> full_name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name" 
                    className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>

                {/* Email field -> email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="name@example.com" 
                    className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>

                {/* Phone Number field -> phone_number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+234..." 
                    className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>

                {/* Target Career Sector -> mapped to interests _text array */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">Primary Area of Interest</label>
                  <select 
                    required
                    value={formData.sector}
                    onChange={(e) => setFormData({...formData, sector: e.target.value})}
                    className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3 text-stone-300 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                  >
                    <option value="" disabled>Select your primary industry</option>
                    <option value="Tech & Engineering">Tech & Software Engineering</option>
                    <option value="Finance & Accounting">Finance & Accounting</option>
                    <option value="Administrative">Administrative & Virtual Assistance</option>
                    <option value="Graphic Design">Graphic Design & Creative Media</option>
                    <option value="Marketing">Marketing & Communications</option>
                  </select>
                </div>

                {/* Password field -> Supabase Auth */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">Password</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>

                <div className="text-xs text-stone-400 font-medium leading-relaxed pt-1">
                  By signing up, your profile details are secure. We sync your target interests straight to our scout pipelines safely.
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-500 text-stone-950 font-extrabold rounded-2xl shadow-xl shadow-amber-600/10 transition transform hover:-translate-y-0.5 active:scale-95 text-center text-sm"
                >
                  {loading ? 'Initializing Profile...' : 'Create Account & Register'}
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