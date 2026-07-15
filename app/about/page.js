"use client"

import { useRouter } from 'next/navigation'

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white relative overflow-x-hidden">
      
      {/* Background Graphic Overlay (Ambient gold-amber warmth) */}
      <div className="fixed inset-0 w-full h-full z-0 bg-stone-950">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 via-stone-950 to-stone-950 z-1"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] z-1"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-600/5 blur-[120px] z-1"></div>
      </div>

      {/* NAVIGATION HEADER */}
      <header className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-stone-900/60 z-10 backdrop-blur-md">
        {/* Left Side: Custom Circular Logo & Brand Name */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="h-11 w-11 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg overflow-hidden shrink-0 relative">
            <span className="text-[11px] font-bold text-white tracking-tighter lowercase font-sans absolute">project</span>
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
            Project Find
          </span>
        </div>

        {/* Center: Top Navigation Tabs */}
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
            className="text-amber-400 transition-colors duration-200 border-b-2 border-amber-400/30 pb-0.5"
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

        {/* Right Side: Log In and Sign Up Buttons */}
        <div className="flex items-center gap-3">
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
      </header>

      {/* ABOUT US CONTENT */}
      <main className="relative max-w-5xl mx-auto px-6 pt-16 pb-24 z-10 space-y-20">
        
        {/* Section 1: Introduction */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 backdrop-blur-md shadow-md">
            Our Mission
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight drop-shadow-md">
            We bridge the gap between job seekers and real opportunities.
          </h1>
          <p className="text-stone-300 text-base sm:text-lg font-medium leading-relaxed">
            The traditional job hunt is broken. Job seekers waste countless hours scanning boards, tailoring CVs, and filling out repetitive application forms, only to be met with silence. **Project Find** was born to change that.
          </p>
        </div>

        {/* Section 2: Split Story Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-white">How We Do It Differently</h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-medium">
              We don't rely on blind algorithmic scrapers or automated bots that trigger spam filters. Instead, Project Find runs on **human-led intelligence**. 
            </p>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed font-medium">
              Our dedicated team of backend scouts acts as your personal job hunting agents. We manually identify prime, active opportunities matching your sector preferences, optimize your presentation, and submit applications directly to employers.
            </p>
            <div className="pt-2">
              <span className="text-amber-400 font-bold text-lg">We keep hunting until you win.</span>
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-stone-800/80 shadow-2xl h-[300px]">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop" 
              alt="Team collaboration" 
              className="w-full h-full object-cover brightness-[0.8] contrast-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent"></div>
          </div>
        </div>

        {/* Section 3: Core Pillars */}
        <div className="border-t border-stone-900/60 pt-16">
          <h2 className="text-3xl font-extrabold text-white text-center mb-12">The Pillars of Project Find</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-stone-950/90 border border-stone-900/80 p-8 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-xl font-bold text-white">Absolute Transparency</h3>
              <p className="text-stone-300 text-sm leading-relaxed font-medium">
                Our simple ₦3,000 flat-rate model guarantees clarity. No hidden platform costs, no monthly subscription traps—just a clear focus on getting you to the interview room.
              </p>
            </div>

            <div className="bg-stone-950/90 border border-stone-900/80 p-8 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-xl font-bold text-white">Efficiency on Autopilot</h3>
              <p className="text-stone-300 text-sm leading-relaxed font-medium">
                While our back-end scouts spend hours scouring networks and submitting clean applications daily, you can dedicate your energy to upskilling and interview preparation.
              </p>
            </div>

            <div className="bg-stone-950/90 border border-stone-900/80 p-8 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-xl font-bold text-white">Quality Placement</h3>
              <p className="text-stone-300 text-sm leading-relaxed font-medium">
                We don't spam. We target industries strategically to ensure the interview invitations you receive are relevant to your long-term professional success.
              </p>
            </div>

          </div>
        </div>

        {/* Section 4: Call to Action (CTA) Box */}
        <div className="bg-gradient-to-r from-stone-950 to-stone-900 border border-amber-500/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full"></div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to skip the search queue?</h2>
          <p className="text-stone-300 text-sm max-w-xl mx-auto mb-8 font-medium">
            Let our team take over the hard work. For just ₦3,000, secure a verified invitation and put your career growth on autopilot.
          </p>
          <button 
            onClick={() => router.push('/register')}
            className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold rounded-xl shadow-xl shadow-amber-600/20 transition transform hover:-translate-y-0.5 active:scale-95"
          >
            Start Your Job Hunt Now
          </button>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative border-t border-stone-900/60 py-8 text-center text-xs text-stone-300 font-medium z-10 backdrop-blur-sm">
        <p>© 2026 Project Find. All rights reserved. Simplifying careers, one applicant at a time.</p>
      </footer>

    </div>
  )
}