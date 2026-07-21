"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Clean up environment variables safely to prevent trailing slash errors
const getCleanSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

// Initialize the Supabase Client locally matching your RegisterPage standard
const supabaseUrl = getCleanSupabaseUrl()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ContactPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false) // State for mobile hamburger menu

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // Direct insertion to public.crm table
      const { error } = await supabase
        .from('crm')
        .insert([
          { 
            name: formData.name, 
            email: formData.email, 
            message: formData.message 
          }
        ])

      if (error) throw error
      
      setSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
      
      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to dispatch message. Please try again or reach out directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white relative overflow-x-hidden">
      
      {/* Background Graphic Overlay */}
      <div className="fixed inset-0 w-full h-full z-0 bg-stone-950">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-stone-950 to-stone-950 z-1"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] z-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-600/5 blur-[120px] z-1"></div>
      </div>

      {/* NAVIGATION HEADER */}
      <header className="relative max-w-7xl mx-auto px-6 py-6 border-b border-stone-900/60 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between gap-6">
          {/* Left Side Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="h-11 w-11 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg overflow-hidden shrink-0 relative">
              <span className="text-[11px] font-bold text-white tracking-tighter lowercase font-sans absolute">project</span>
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
              Project Find
            </span>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile) */}
          <nav className="hidden lg:flex items-center justify-center gap-x-6 gap-y-2 text-sm font-bold text-stone-300">
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
              className="text-amber-400 transition-colors duration-200 border-b-2 border-amber-400/30 pb-0.5"
            >
              Contact Us
            </button>
          </nav>

          {/* Desktop Actions (Hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-3">
            <button 
              onClick={() => router.push('/login')}
              className="px-5 py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md"
            >
              Log In
            </button>
            <button 
              onClick={() => router.push('/register')}
              className="px-5 py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile Hamburger Button (Visible on mobile only) */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-stone-200 hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? (
                /* Close Icon (X) */
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                /* Hamburger Icon */
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-stone-900 flex flex-col space-y-4">
            <nav className="flex flex-col space-y-3 text-sm font-bold text-stone-300">
              <button 
                onClick={() => { router.push('/'); setIsMenuOpen(false); }} 
                className="text-left py-1 hover:text-amber-400 transition-colors duration-200"
              >
                Home
              </button>
              <button 
                onClick={() => { router.push('/#how-it-works'); setIsMenuOpen(false); }} 
                className="text-left py-1 hover:text-amber-400 transition-colors duration-200"
              >
                How It Works
              </button>
              <button 
                onClick={() => { router.push('/faq'); setIsMenuOpen(false); }} 
                className="text-left py-1 hover:text-amber-400 transition-colors duration-200"
              >
                FAQ
              </button>
              <button 
                onClick={() => { router.push('/about'); setIsMenuOpen(false); }} 
                className="text-left py-1 hover:text-amber-400 transition-colors duration-200"
              >
                About Us
              </button>
              <button 
                onClick={() => { router.push('/privacy'); setIsMenuOpen(false); }} 
                className="text-left py-1 hover:text-amber-400 transition-colors duration-200"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => { router.push('/contact'); setIsMenuOpen(false); }} 
                className="text-left py-1 text-amber-400 transition-colors duration-200"
              >
                Contact Us
              </button>
            </nav>

            <div className="pt-2 flex flex-col gap-2.5 border-t border-stone-900/80">
              <button 
                onClick={() => { router.push('/login'); setIsMenuOpen(false); }}
                className="w-full py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md text-center"
              >
                Log In
              </button>
              <button 
                onClick={() => { router.push('/register'); setIsMenuOpen(false); }}
                className="w-full py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md text-center"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* CONTACT US CONTENT */}
      <main className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 z-10">
        
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 backdrop-blur-md shadow-md">
            Get In Touch
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-md">
            We’re Here to Help You Succeed
          </h1>
          <p className="text-stone-300 text-base sm:text-lg font-medium leading-relaxed">
            Have questions about your job hunting cycle, payments, or specialized recruitment needs? Reach out to our scout team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT: Contact Information Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Phone Number 1 Card */}
            <div className="bg-stone-950/90 border border-stone-900/80 backdrop-blur-md p-6 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-base font-bold text-stone-400 uppercase tracking-wider">Primary Support Line</h3>
              </div>
              <p className="text-2xl font-black text-white tracking-tight">
                +234 707 508 1796
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.528 2.015 14.053.99 11.433.99c-5.436 0-9.859 4.37-9.863 9.8c0 1.73.457 3.41 1.32 4.925l-1.02 3.723 3.812-.984zm11.196-7.55c-.29-.145-1.716-.848-1.983-.946-.266-.097-.459-.145-.653.145-.193.29-.749.946-.918 1.14-.169.193-.338.217-.628.072-2.316-1.16-3.21-1.694-4.884-4.561-.27-.464.27-.43.774-1.432.083-.169.041-.318-.02-.464-.063-.145-.653-1.572-.895-2.152-.236-.569-.475-.492-.653-.502-.17-.008-.362-.01-.555-.01-.193 0-.507.072-.772.362-.266.29-1.014.99-1.014 2.415 0 1.425 1.038 2.8 1.182 2.993.145.193 2.043 3.12 4.949 4.374.69.298 1.23.476 1.65.61.694.22 1.326.19 1.825.115.556-.083 1.717-.7 1.958-1.376.242-.676.242-1.256.169-1.376-.073-.12-.266-.194-.556-.34z"/>
                  </svg>
                  WhatsApp Support
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
                  Voice Calling Available
                </span>
              </div>
            </div>

            {/* Phone Number 2 Card */}
            <div className="bg-stone-950/90 border border-stone-900/80 backdrop-blur-md p-6 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-base font-bold text-stone-400 uppercase tracking-wider">Secondary Contact Line</h3>
              </div>
              <p className="text-2xl font-black text-amber-400 tracking-tight">
                +234 802 412 3819
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.528 2.015 14.053.99 11.433.99c-5.436 0-9.859 4.37-9.863 9.8c0 1.73.457 3.41 1.32 4.925l-1.02 3.723 3.812-.984zm11.196-7.55c-.29-.145-1.716-.848-1.983-.946-.266-.097-.459-.145-.653.145-.193.29-.749.946-.918 1.14-.169.193-.338.217-.628.072-2.316-1.16-3.21-1.694-4.884-4.561-.27-.464.27-.43.774-1.432.083-.169.041-.318-.02-.464-.063-.145-.653-1.572-.895-2.152-.236-.569-.475-.492-.653-.502-.17-.008-.362-.01-.555-.01-.193 0-.507.072-.772.362-.266.29-1.014.99-1.014 2.415 0 1.425 1.038 2.8 1.182 2.993.145.193 2.043 3.12 4.949 4.374.69.298 1.23.476 1.65.61.694.22 1.326.19 1.825.115.556-.083 1.717-.7 1.958-1.376.242-.676.242-1.256.169-1.376-.073-.12-.266-.194-.556-.34z"/>
                  </svg>
                  WhatsApp Support
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
                  Voice Calling Available
                </span>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-stone-950/90 border border-stone-900/80 backdrop-blur-md p-6 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-base font-bold text-stone-400 uppercase tracking-wider">Official Support Email</h3>
              </div>
              <a 
                href="mailto:kossiigboanugo@gmail.com" 
                className="text-xl font-black text-stone-100 hover:text-amber-400 transition-colors tracking-tight block break-all underline decoration-amber-500/50"
              >
                kossiigboanugo@gmail.com
              </a>
              <p className="text-stone-400 text-xs font-semibold">
                We generally respond to all operational inquiries within 24 hours.
              </p>
            </div>

          </div>

          {/* RIGHT: Modern Direct Message Form */}
          <div className="lg:col-span-7 bg-gradient-to-b from-stone-950/95 to-stone-950/100 border border-stone-800/80 backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-2">Send Us a Direct Message</h2>
            <p className="text-stone-300 text-sm font-medium mb-8">
              Fill out the brief form below and an administrator will follow up with you.
            </p>

            {submitted ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center space-y-2">
                <h3 className="text-lg font-bold text-green-400">Message Sent Successfully!</h3>
                <p className="text-stone-300 text-sm font-medium">Thank you for reaching out. We will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-semibold">
                    {errorMsg}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Your Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name" 
                    className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="name@example.com" 
                    className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Message</label>
                  <textarea 
                    rows="4"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="How can our scout team help you?" 
                    className="w-full bg-stone-900/60 border border-stone-800/80 rounded-xl px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold rounded-2xl shadow-xl shadow-amber-600/10 transition transform hover:-translate-y-0.5 active:scale-95 text-center disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Message'}
                </button>
              </form>
            )}

          </div>

        </div>

      </main>

      {/* FAQ LINK SHORTCUT */}
      <section className="relative max-w-4xl mx-auto px-6 pb-20 z-10 text-center">
        <div className="border-t border-stone-900/60 pt-12">
          <p className="text-stone-300 font-medium">
            Have a fast question regarding refunds or applications? 
            <button onClick={() => router.push('/faq')} className="text-amber-400 hover:underline font-bold ml-1.5">
              Check our FAQ page.
            </button>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-stone-900/60 py-8 text-center text-xs text-stone-300 font-medium z-10 backdrop-blur-sm">
        <p>© 2026 Project Find. All rights reserved. Simplifying careers, one applicant at a time.</p>
      </footer>

    </div>
  )
}