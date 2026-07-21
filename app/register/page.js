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

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    sector: '', 
    phone: '' 
  })
  
  // Toggles for showing/hiding raw text in password fields
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Ref to target the exact form card box where details are entered
  const formSectionRef = useRef(null)

  // Automatically scroll down to the input form section on page load for both mobile and PC
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

    // Verify passwords match before making any external API calls
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Passwords do not match. Please retype and try again.")
      setLoading(false)
      return
    }

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
      setFormData({ name: '', email: '', password: '', confirmPassword: '', sector: '', phone: '' })
      
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

          {/* Center Navigation Tabs (Hidden on mobile, visible on desktop/PC) */}
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
                className="px-5 py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md"
              >
                Log In
              </button>
              <button 
                onClick={() => handleNavigation('/register')}
                className="px-5 py-2.5 bg-stone-900/90 text-amber-400 text-sm font-semibold rounded-xl border border-amber-500/20 backdrop-blur transition shadow-md"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile Hamburger Toggle Button (Affects mobile only) */}
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
                className="w-full py-2.5 bg-stone-900 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 text-center"
              >
                Log In
              </button>
              <button 
                onClick={() => handleNavigation('/register')}
                className="w-full py-2.5 bg-stone-900 text-amber-400 text-sm font-semibold rounded-xl border border-amber-500/20 text-center"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* SIGN UP MAIN CONTENT */}
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

          {/* Right Column: Active Form Card */}
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
                
                {/* Full Name field */}
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

                {/* Email field */}
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

                {/* Phone Number field */}
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

                {/* Target Career Sector */}
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

                {/* Grid Layout for Passwords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Password Field with Eye Icon */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl pl-4 pr-11 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-amber-400 transition-colors"
                      >
                        {showPassword ? (
                          /* Eye Off Icon */
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          /* Eye Icon */
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field with Eye Icon */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl pl-4 pr-11 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-amber-400 transition-colors"
                      >
                        {showConfirmPassword ? (
                          /* Eye Off Icon */
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          /* Eye Icon */
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

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