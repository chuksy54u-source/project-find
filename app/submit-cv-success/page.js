"use client"

import { useRouter } from 'next/navigation'

export default function SubmitCvSuccessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white relative overflow-hidden flex flex-col justify-between">
      
      {/* 🖼️ BACKGROUND VISUAL */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1800&auto=format&fit=crop" 
          alt="Premium background shadow" 
          className="w-full h-full object-cover brightness-50 contrast-[1.1] saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/45 via-stone-950/95 to-stone-950 z-1"></div>
        <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[150px] z-1"></div>
      </div>

      {/* NAVIGATION SIMULACRUM (FOR COHESIVE LOOK) */}
      <header className="relative max-w-7xl mx-auto w-full px-6 py-4 flex flex-row items-center justify-between border-b border-stone-900/60 z-10 backdrop-blur-md bg-stone-950/40">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/dashboard')}>
          <div className="h-9 w-9 bg-black rounded-full flex items-center justify-center border border-stone-850 shadow-lg relative shrink-0">
            <span className="text-[9px] font-bold text-white tracking-tighter lowercase absolute">project</span>
          </div>
          <span className="text-lg font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
            Project Find
          </span>
        </div>
      </header>

      {/* 🚀 SCREEN POPUP / SUCCESS HERO ACTION CARD */}
      <main className="relative flex-grow flex items-center justify-center px-6 py-12 z-10">
        <div className="max-w-xl w-full bg-stone-950/90 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] text-center space-y-6">
          
          {/* Animated Success Check Icon */}
          <div className="mx-auto h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-4xl shadow-lg relative">
            <span className="animate-pulse">✨</span>
            <span className="absolute">✅</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Successful CV Submission!
            </h1>
            <p className="text-amber-400 font-bold uppercase tracking-widest text-[10px]">
              🚀 Job Matching Cycle Started
            </p>
          </div>

          <p className="text-stone-300 text-xs sm:text-sm font-medium leading-relaxed max-w-md mx-auto">
            Your credentials have been securely registered within our partner employer registry. Please make sure to **monitor your email inbox** and **check your interviews tab regularly** for direct schedule requests and incoming call links.
          </p>

          <div className="pt-4 border-t border-stone-900/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="py-3 bg-stone-900 hover:bg-stone-850 text-stone-200 hover:text-white font-bold rounded-xl border border-stone-800 transition text-xs shadow-md"
            >
              Back to Dashboard
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              className="py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-xl shadow-lg transition text-xs"
            >
              Monitor Interviews Tab
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