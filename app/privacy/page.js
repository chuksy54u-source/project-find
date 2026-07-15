"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LegalPortalPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('privacy')

  const legalSections = [
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'terms', label: 'Terms of Service' },
    { id: 'cookies', label: 'Cookie Policy' },
    { id: 'security', label: 'Data Security' },
  ]

  const handlePrint = () => {
    window.print()
  }

  // Dynamic Content Render Engine
  const renderContent = () => {
    switch (activeTab) {
      case 'privacy':
        return (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-900/60 pb-6">
              <div>
                <h1 className="text-3xl font-black text-white">Privacy Policy</h1>
                <p className="text-xs text-stone-400 font-mono mt-1">Effective Date: April 30th, 2026</p>
              </div>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-extrabold rounded-lg shadow-md transition-all self-start sm:self-center"
              >
                Print / Download PDF
              </button>
            </div>

            <div className="space-y-6 text-sm text-stone-300 leading-relaxed font-medium">
              <p>
                This Privacy Policy explains how and why Project Find collects, uses, and shares personal information when you interact with or use our Platform, mobile features, or web-based services. It applies to all users who submit data, process matching cycles, or upload resumes.
              </p>
              <p>
                When we say <strong>“Project Find”</strong>, we mean the operational team and parent affiliates behind the recruitment matching interface. When we say <strong>“Service”</strong>, we refer to our manual job-matching platform, which coordinates with external job directories and third-party career environments to secure official interview invitations.
              </p>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">1. Information We Collect</h3>
                <p>
                  To successfully run your automated matching cycle and apply to employers on your behalf, we must process specific criteria details. This includes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-stone-400">
                  <li><strong>Identity Details:</strong> Full name, email address, and active mobile lines used for contact.</li>
                  <li><strong>Professional Credentials:</strong> Resumes, CV uploads, portfolios, target sectors, and employment histories.</li>
                  <li><strong>Financial Transactions:</strong> Payment tracking logs confirming your ₦3,000 one-time flat processing fee (handled via verified local gateways; we never store raw credit card numbers).</li>
                </ul>
              </div>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">2. How We Use Your Information</h3>
                <p>
                  Project Find operates under strict transactional parameters. Your details are accessed purely to facilitate operations. We use your data to identify and screen active job vacancies matching your professional track and submit application entries on your behalf directly to employers.
                </p>
              </div>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">3. Data Sharing & Third Parties</h3>
                <p>
                  We value your security above all else. Project Find <strong>does not sell, lease, or distribute</strong> your credentials or contacts to independent ad network corporations. Your data is only shared with active recruiting organizations, HR administrative personnel, and hiring corporations where you have authorized us to place applications.
                </p>
              </div>
            </div>
          </>
        )

      case 'terms':
        return (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-900/60 pb-6">
              <div>
                <h1 className="text-3xl font-black text-white">Terms of Service</h1>
                <p className="text-xs text-stone-400 font-mono mt-1">Last Updated: April 30th, 2026</p>
              </div>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-extrabold rounded-lg shadow-md transition-all self-start sm:self-center"
              >
                Print / Download PDF
              </button>
            </div>

            <div className="space-y-6 text-sm text-stone-300 leading-relaxed font-medium">
              <p>
                Welcome to Project Find. By accessing our platform, processing payments, or registering an account, you agree to comply with and be bound by the following terms and conditions.
              </p>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">1. Service Scope & The "Single Interview" Promise</h3>
                <p>
                  Project Find matches candidate criteria to active job openings and manually coordinates applications. 
                </p>
                <p className="bg-stone-900/50 border-l-2 border-amber-500 p-4 rounded-r-xl text-stone-200">
                  <strong>The Flat-Rate Rule:</strong> Your flat payment of ₦3,000 initiates one (1) job search cycle. This cycle is valid indefinitely and our team will keep searching and applying for you until we secure you exactly <strong>one (1) verified interview invitation</strong>.
                </p>
                <p>
                  Once a verified interview invitation (via email, call, or official dashboard notice) is delivered to you from an employer we applied to, the cycle is completed and the fee is finalized—regardless of whether you pass or fail that interview. To initiate a brand new search cycle, a new payment is required.
                </p>
              </div>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">2. User Account Integrity & CV Accuracy</h3>
                <p>
                  You are responsible for uploading truthful, accurate, and current information within your profile and CV document. Project Find is not responsible for any application rejections resulting from inaccurate or outdated resumes provided by you.
                </p>
              </div>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">3. Refund Policy</h3>
                <p>
                  Due to the immediate manual labor deployed by our backend scout team upon payment confirmation, the ₦3,000 processing fee is non-refundable once our team begins actively filtering and submitting applications on your behalf.
                </p>
              </div>
            </div>
          </>
        )

      case 'cookies':
        return (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-900/60 pb-6">
              <div>
                <h1 className="text-3xl font-black text-white">Cookie Policy</h1>
                <p className="text-xs text-stone-400 font-mono mt-1">Effective Date: April 30th, 2026</p>
              </div>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-extrabold rounded-lg shadow-md transition-all self-start sm:self-center"
              >
                Print / Download PDF
              </button>
            </div>

            <div className="space-y-6 text-sm text-stone-300 leading-relaxed font-medium">
              <p>
                Like most modern web platforms, Project Find utilizes small text files called cookies to deliver a streamlined, intuitive dashboard experience.
              </p>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">1. Strictly Necessary Cookies</h3>
                <p>
                  These cookies are essential for you to log in, move around the platform, and access secure payment pathways. Without these cookies, services like user authentication dashboards and session tracking cannot be provided.
                </p>
              </div>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">2. Preference & Analytics Cookies</h3>
                <p>
                  These help us remember your configuration states (such as selected career sectors or dark mode preferences) and allow us to collect anonymized telemetry on how users interact with our landing pages. This helps us optimize load speeds and layout designs.
                </p>
              </div>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">3. Managing Your Cookies</h3>
                <p>
                  You can choose to disable cookies through your individual browser settings at any time. However, please note that turning off necessary cookies may prevent your account dashboard from maintaining your logged-in session securely.
                </p>
              </div>
            </div>
          </>
        )

      case 'security':
        return (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-900/60 pb-6">
              <div>
                <h1 className="text-3xl font-black text-white">Data Security</h1>
                <p className="text-xs text-stone-400 font-mono mt-1">System Status: Active & Secure</p>
              </div>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 text-xs font-extrabold rounded-lg shadow-md transition-all self-start sm:self-center"
              >
                Print / Download PDF
              </button>
            </div>

            <div className="space-y-6 text-sm text-stone-300 leading-relaxed font-medium">
              <p>
                At Project Find, we understand that your CV contains highly personal professional information. We treat your digital footprint with institutional-grade security.
              </p>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">1. Secure Database Isolation</h3>
                <p>
                  All user profile metrics, upload endpoints, and messaging trails are guarded behind encrypted cloud infrastructure frameworks. Database tables enforce strict Row-Level Security (RLS) policies, meaning your CV and files can never be accessed or viewed by other unauthorized platform users.
                </p>
              </div>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">2. Transport Layer Encryption (HTTPS)</h3>
                <p>
                  All data transmitted between your local web browser and our administrative servers is protected with high-grade SSL/TLS end-to-end encryption. This prevents interception or packet listening during your transaction and upload processes.
                </p>
              </div>

              <div className="border-t border-stone-900/40 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-white">3. Payment Safety</h3>
                <p>
                  We coordinate payments strictly through audited, compliant local gateways. Project Find servers never view, log, or store your raw payment cards, pin numbers, or billing parameters.
                </p>
              </div>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Glow */}
      <div className="fixed inset-0 w-full h-full z-0 bg-stone-950">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/5 via-stone-950 to-stone-950 z-1"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[120px] z-1"></div>
      </div>

      {/* NAVIGATION HEADER */}
      <header className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col lg:flex-row items-center justify-between gap-6 border-b border-stone-900/60 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="h-11 w-11 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg overflow-hidden shrink-0 relative">
            <span className="text-[11px] font-bold text-white tracking-tighter lowercase font-sans absolute">project</span>
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
            Project Find
          </span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-bold text-stone-300">
          <button onClick={() => router.push('/')} className="hover:text-amber-400 transition-colors duration-200">
            Home
          </button>
          <button onClick={() => router.push('/#how-it-works')} className="hover:text-amber-400 transition-colors duration-200">
            How It Works
          </button>
          <button onClick={() => router.push('/faq')} className="hover:text-amber-400 transition-colors duration-200">
            FAQ
          </button>
          <button onClick={() => router.push('/about')} className="hover:text-amber-400 transition-colors duration-200">
            About Us
          </button>
          <button onClick={() => router.push('/privacy')} className="text-amber-400 transition-colors duration-200 border-b-2 border-amber-400/30 pb-0.5">
            Privacy Policy
          </button>
          <button onClick={() => router.push('/contact')} className="hover:text-amber-400 transition-colors duration-200">
            Contact Us
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/login')} className="px-5 py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md">
            Log In
          </button>
          <button onClick={() => router.push('/register')} className="px-5 py-2.5 bg-stone-900/90 hover:bg-stone-850 text-stone-100 text-sm font-semibold rounded-xl border border-stone-800 backdrop-blur transition shadow-md">
            Sign Up
          </button>
        </div>
      </header>

      {/* LEGAL PORTAL SECTION */}
      <main className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: DIRECTORY SIDEBAR */}
        <aside className="lg:col-span-3 space-y-2 lg:sticky lg:top-24">
          <div className="px-4 pb-4 border-b border-stone-900/60 lg:border-none">
            <span className="text-xs font-mono font-bold tracking-widest text-stone-500 uppercase">Legal Directory</span>
            <h2 className="text-lg font-black text-white mt-1">Project Find Legal</h2>
          </div>
          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 pb-3 lg:pb-0 border-b lg:border-none border-stone-900/40">
            {legalSections.map((sect) => (
              <button
                key={sect.id}
                onClick={() => setActiveTab(sect.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition whitespace-nowrap lg:whitespace-normal shrink-0 ${
                  activeTab === sect.id
                    ? "bg-amber-500/10 text-amber-400 border-l-2 border-amber-400"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/40"
                }`}
              >
                {sect.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* RIGHT COLUMN: MAIN CONTENT CONTAINER */}
        <section className="lg:col-span-9 bg-stone-950/40 border border-stone-900/80 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-sm space-y-8">
          
          {renderContent()}

          {/* Compliance Bottom Badge Layout */}
          <div className="border-t border-stone-900/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-stone-400">
              For additional assistance, write directly to <a href="mailto:kossiigboanugo@gmail.com" className="text-amber-400 hover:underline">kossiigboanugo@gmail.com</a>.
            </p>
            <div className="flex items-center space-x-3 bg-stone-950 border border-stone-900 px-4 py-2 rounded-xl">
              <div className="h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center text-stone-950 font-bold text-[10px]">
                ✓
              </div>
              <span className="text-[10px] font-mono tracking-wider text-stone-300 uppercase">Secure Data Guaranteed</span>
            </div>
          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="relative border-t border-stone-900/60 py-8 text-center text-xs text-stone-300 font-medium z-10 backdrop-blur-sm">
        <p>© 2026 Project Find. All rights reserved. Simplifying careers, one applicant at a time.</p>
      </footer>

    </div>
  )
}