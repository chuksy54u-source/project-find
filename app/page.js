"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [activeFaq, setActiveFaq] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Background slide images representing corporate work environments
  const backgroundSlides = [
    {
      url: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
      caption: "Our scouts match you with premium corporate environments."
    },
    {
      url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1600&auto=format&fit=crop",
      caption: "We keep applying until you are sitting in the interview room."
    },
    {
      url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1600&auto=format&fit=crop",
      caption: "Direct access to hidden recruiter networks."
    }
  ]

  // Foreground Image Carousel representing candidates getting results
  const foregroundSlides = [
    {
      url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop",
      text: "Securing opportunities for top candidates."
    },
    {
      url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
      text: "Our dedicated backend scouts actively review listings."
    },
    {
      url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=800&auto=format&fit=crop",
      text: "Applying on autopilot while you focus on prep."
    }
  ]

  // Cycle slide images every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % backgroundSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [backgroundSlides.length])

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const faqs = [
    {
      q: "What exactly does the ₦3,000 fee cover?",
      a: "It covers our backend scout team actively matching and applying to jobs on your behalf. This one-time payment is valid for a single entire cycle—meaning we keep hunting for you until we secure you a verified interview invite."
    },
    {
      q: "What happens if I fail or pass the interview?",
      a: "Once you receive an official interview invitation from an employer we found, our cycle is complete and the current fee is invalidated. If you need us to run another job hunt for you, you can easily start a new cycle for another ₦3,000."
    },
    {
      q: "How do you apply for jobs on my behalf?",
      a: "Our team takes your uploaded CV and target interests, filters active listings (including premium platforms like Jobberman), and manually submits tailored applications on your behalf using our specialized recruiter channels."
    }
  ]

  // Smooth scroll handler for same-page anchors
  const handleScrollTo = (id) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleNavClick = (path) => {
    setMobileMenuOpen(false)
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white relative overflow-x-hidden">
      
      {/* ULTRA-BRIGHTENED FULL-SCREEN BACKGROUND SLIDESHOW LAYER */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
        {backgroundSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full transition-all duration-[2000ms] ease-in-out ${
              idx === currentSlide ? "opacity-70 scale-100" : "opacity-0 scale-105"
            }`}
          >
            <img
              src={slide.url}
              alt="Real office environment"
              className="w-full h-full object-cover brightness-[0.80] contrast-[1.05]"
            />
          </div>
        ))}
        {/* Warm brown/amber gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/30 to-stone-950/90 z-1"></div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-stone-950/20 to-stone-950/80 z-1"></div>
      </div>

      {/* NAVIGATION HEADER WITH RESPONSIVE HAMBURGER MENU */}
      <header className="relative max-w-7xl mx-auto px-6 py-6 border-b border-stone-900/60 z-20 backdrop-blur-md">
        <div className="flex items-center justify-between">
          
          {/* Left Side: Custom Circular Logo & Brand Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
            <div className="h-11 w-11 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg overflow-hidden shrink-0 relative">
              <span className="text-[11px] font-bold text-white tracking-tighter lowercase font-sans absolute">project</span>
            </div>
            <span className="text-xl font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
              Project Find
            </span>
          </div>

          {/* Desktop Center Navigation Tabs (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center gap-x-6 text-sm font-bold text-stone-300">
            <button 
              onClick={() => handleScrollTo('how-it-works')} 
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

          {/* Desktop Right Side Action Buttons (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => router.push('/login')}
              className="px-5 py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md"
            >
              Log In
            </button>
            <button 
              onClick={() => router.push('/register')}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-sm font-bold rounded-xl transition shadow-md"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile Hamburger Toggle Button (Visible on Mobile only) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-200 hover:text-white focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-stone-800/80 flex flex-col space-y-3 bg-stone-950/95 p-5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <button 
              onClick={() => handleScrollTo('how-it-works')}
              className="text-left py-2 px-3 text-sm font-bold text-stone-200 hover:bg-stone-900 rounded-lg transition"
            >
              How It Works
            </button>
            <button 
              onClick={() => handleNavClick('/faq')}
              className="text-left py-2 px-3 text-sm font-bold text-stone-200 hover:bg-stone-900 rounded-lg transition"
            >
              FAQ
            </button>
            <button 
              onClick={() => handleNavClick('/about')}
              className="text-left py-2 px-3 text-sm font-bold text-stone-200 hover:bg-stone-900 rounded-lg transition"
            >
              About Us
            </button>
            <button 
              onClick={() => handleNavClick('/privacy')}
              className="text-left py-2 px-3 text-sm font-bold text-stone-200 hover:bg-stone-900 rounded-lg transition"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => handleNavClick('/contact')}
              className="text-left py-2 px-3 text-sm font-bold text-stone-200 hover:bg-stone-900 rounded-lg transition"
            >
              Contact Us
            </button>

            <div className="pt-3 border-t border-stone-900 flex flex-col gap-2">
              <button 
                onClick={() => handleNavClick('/login')}
                className="w-full py-3 bg-stone-900 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 text-center"
              >
                Log In
              </button>
              <button 
                onClick={() => handleNavClick('/register')}
                className="w-full py-3 bg-amber-600 text-stone-950 text-sm font-bold rounded-xl text-center"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* SPLIT-SCREEN HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-6 pt-12 lg:pt-20 pb-20 z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* LEFT COLUMN: HERO MARKETING COPY */}
        <div className="lg:col-span-7 text-left space-y-6">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 backdrop-blur-md shadow-md">
            The Ultimate Job Hunting Shortcut
          </span>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] text-white">
            You focus on preparing. <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
              We’ll handle the applying.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-100 leading-relaxed max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-semibold">
            Stop spending hours scroll-searching and filling out endless applications. For a single flat fee of <strong className="text-white underline decoration-amber-400 decoration-2">₦3,000</strong>, our dedicated recruiter team takes your CV and secures your next interview invite for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button 
              onClick={() => router.push('/register')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold rounded-2xl shadow-xl shadow-amber-600/30 transition transform hover:-translate-y-0.5 active:scale-95 text-lg text-center"
            >
              Start Your Job Hunt – ₦3,000
            </button>
            <button 
              onClick={() => handleScrollTo('how-it-works')}
              className="w-full sm:w-auto px-8 py-4 bg-stone-950/90 hover:bg-stone-900 text-stone-200 font-bold rounded-2xl border border-stone-800 backdrop-blur-md transition text-lg text-center shadow-lg"
            >
              Learn How It Works
            </button>
          </div>

          <div className="flex items-center gap-6 text-xs text-white font-mono font-extrabold pt-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            <span>UNCOMPROMISED SECURITY</span>
            <span>•</span>
            <span>VALID UNTIL INTERVIEW SECURED</span>
          </div>
        </div>

        {/* RIGHT COLUMN: REVEAL REAL-WORLD CANDIDATE DISPLAY SLIDESHOW */}
        <div className="lg:col-span-5 relative w-full h-[350px] sm:h-[450px] rounded-3xl overflow-hidden border border-stone-800/80 bg-stone-900/50 backdrop-blur-sm shadow-2xl shadow-amber-500/5">
          
          {/* Foreground Loop */}
          {foregroundSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <img
                src={slide.url}
                alt="Active corporate applicant"
                className="w-full h-full object-cover brightness-[0.9] contrast-[1.05]"
              />
              
              {/* Sleek bottom text banner */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/10 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-stone-950/90 border border-stone-800/60 p-4 rounded-xl backdrop-blur-md">
                <p className="text-sm font-bold text-stone-100 leading-snug">
                  {slide.text}
                </p>
              </div>
            </div>
          ))}

          {/* Dots Indicator */}
          <div className="absolute top-6 right-6 z-30 flex space-x-1.5 bg-stone-950/90 border border-stone-800/60 p-2 rounded-full backdrop-blur-md">
            {foregroundSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "w-4 bg-amber-400" : "w-1.5 bg-stone-600"
                }`}
              ></button>
            ))}
          </div>

        </div>

      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative max-w-6xl mx-auto px-6 py-24 border-t border-stone-900/60 z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white drop-shadow">How Project Find Works</h2>
          <p className="text-stone-200 font-medium mt-2 drop-shadow">Four simple steps to put your career search on complete autopilot.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          <div className="bg-stone-950/90 border border-stone-900/80 backdrop-blur-md p-6 rounded-2xl shadow-lg">
            <div className="text-xl font-mono font-bold text-amber-400 mb-4">01</div>
            <h3 className="text-lg font-bold text-stone-100">Sign Up & Pay</h3>
            <p className="text-stone-300 text-sm mt-2 leading-relaxed font-medium">
              Create your account and pay the flat ₦3,000 processing fee to trigger our search engine.
            </p>
          </div>

          <div className="bg-stone-950/90 border border-stone-900/80 backdrop-blur-md p-6 rounded-2xl shadow-lg">
            <div className="text-xl font-mono font-bold text-amber-400 mb-4">02</div>
            <h3 className="text-lg font-bold text-stone-100">Select Sectors</h3>
            <p className="text-stone-300 text-sm mt-2 leading-relaxed font-medium">
              Tell us your target fields (Tech, Admin, Finance, etc.) and easily drag & drop your core CV.
            </p>
          </div>

          <div className="bg-stone-950/90 border border-stone-900/80 backdrop-blur-md p-6 rounded-2xl shadow-lg">
            <div className="text-xl font-mono font-bold text-amber-400 mb-4">03</div>
            <h3 className="text-lg font-bold text-stone-100">Scouts At Work</h3>
            <p className="text-stone-300 text-sm mt-2 leading-relaxed font-medium">
              Our admin team filters listings and applies directly to employers using your profile details.
            </p>
          </div>

          <div className="bg-stone-950/90 border border-stone-900/80 backdrop-blur-md p-6 rounded-2xl shadow-lg">
            <div className="text-xl font-mono font-bold text-amber-400 mb-4">04</div>
            <h3 className="text-lg font-bold text-stone-100">Interview Secured</h3>
            <p className="text-stone-300 text-sm mt-2 leading-relaxed font-medium">
              Receive your verified invitation on your dashboard. Your search cycle is now complete!
            </p>
          </div>

        </div>
      </section>

      {/* PRICING & THE RULE */}
      <section className="relative max-w-4xl mx-auto px-6 py-12 z-10">
        <div className="bg-gradient-to-b from-stone-950/95 to-stone-950/100 border border-stone-800/80 backdrop-blur-md rounded-3xl p-8 md:p-12 text-center shadow-2xl">
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">Simple Flat Pricing</span>
          <h2 className="text-3xl font-extrabold mt-3 text-white">The "Single Interview" Promise</h2>
          
          <div className="my-8">
            <span className="text-6xl font-black text-white">₦3,000</span>
            <span className="text-stone-300 text-sm block mt-2 font-semibold">Valid until the end of the search process</span>
          </div>

          <div className="max-w-xl mx-auto space-y-4 text-stone-200 text-sm leading-relaxed border-t border-stone-900/85 pt-6 font-medium">
            <p>
              **Our Simple Rule:** Your fee keeps us searching for you indefinitely until we land you an official interview invitation.
            </p>
            <p>
              Once you get that invitation, our service is complete. Whether you pass or fail that interview, the fee is finalized. To start a brand new search cycle, you simply pay again.
            </p>
          </div>

          <button 
            onClick={() => router.push('/register')}
            className="mt-8 px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-extrabold rounded-xl transition shadow-lg shadow-amber-600/20 active:scale-95"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="relative max-w-3xl mx-auto px-6 py-20 z-10">
        <h2 className="text-2xl font-extrabold text-center mb-10 text-white drop-shadow">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-stone-950/90 border border-stone-900/80 backdrop-blur-md rounded-2xl overflow-hidden transition shadow-lg">
              <button 
                onClick={() => toggleFaq(idx)}
                className="w-full text-left px-6 py-5 font-bold text-stone-100 hover:text-white flex justify-between items-center"
              >
                <span>{faq.q}</span>
                <span className="text-lg text-stone-300">{activeFaq === idx ? "−" : "+"}</span>
              </button>
              
              {activeFaq === idx && (
                <div className="px-6 pb-6 text-sm text-stone-300 leading-relaxed border-t border-stone-900/60 pt-4 font-medium">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* DIGITALIZED SPONSORSHIP CARD */}
      <section className="relative max-w-5xl mx-auto px-6 pb-20 z-10">
        <div className="relative rounded-3xl overflow-hidden border border-stone-800/80 shadow-2xl bg-stone-900/40">
          
          {/* Card Image Layer */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop" 
              alt="Corporate Partnership" 
              className="w-full h-full object-cover brightness-[0.25] contrast-[1.10] saturate-[0.80]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent"></div>
          </div>

          {/* Card Content Layer */}
          <div className="relative z-10 px-8 py-12 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                Enterprise & Sponsorship
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                Partner with Project Find to scale talent networks.
              </h2>
              <p className="text-stone-300 text-sm md:text-base leading-relaxed">
                Unlock specialized visibility, connect with vetted professionals, and elevate your recruitment ecosystem. Let's build collaborative opportunities.
              </p>
            </div>

            <button 
              onClick={() => router.push('/contact')}
              className="w-full md:w-auto px-8 py-4 bg-white hover:bg-stone-200 text-stone-950 font-extrabold text-sm rounded-xl transition-all shadow-lg whitespace-nowrap"
            >
              Become a Sponsor
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-stone-900/60 py-12 text-center text-xs text-stone-400 font-medium z-10 backdrop-blur-sm">
        <p>© 2026 Project Find. All rights reserved. Simplifying careers, one applicant at a time.</p>
      </footer>

    </div>
  )
}