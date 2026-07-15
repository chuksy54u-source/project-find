"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DedicatedFaqPage() {
  const router = useRouter()
  const [activeFaq, setActiveFaq] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    {
      id: "payments",
      title: "Payments & Verification",
      faqs: [
        {
          q: "How long does it take for my ₦3,000 payment to be verified?",
          a: "Payments made via our Paystack gateway are verified instantly. Your dashboard will be activated immediately after a successful transaction, allowing you to upload your CV and select your target sectors without delay."
        },
        {
          q: "Are there any hidden charges after the ₦3,000 payment?",
          a: "No. There are absolutely no hidden charges. The ₦3,000 fee covers the entire application process until we secure you a verified interview invitation."
        },
        {
          q: "Can I get a refund if I change my mind?",
          a: "Because our backend scouts begin actively processing your CV and searching for matches immediately upon payment, we do not issue refunds once the search cycle has officially commenced."
        }
      ]
    },
    {
      id: "process",
      title: "The Application Process",
      faqs: [
        {
          q: "How long will it take to get my first interview invite?",
          a: "While timelines vary depending on your target sector and current market demand, most candidates receive their first verified interview invitation within 7 to 14 business days of their cycle launch."
        },
        {
          q: "Do you write or edit my CV for me?",
          a: "We do not rewrite your CV from scratch. However, our scouts will review your submitted CV and may suggest quick formatting optimizations to ensure it successfully passes through corporate applicant tracking systems (ATS)."
        },
        {
          q: "Can I choose which specific companies you apply to?",
          a: "You select your target industries, job roles, and preferences. Our scouts then match you with the best available open positions. While you don't approve individual applications beforehand, we only apply to roles matching your profile specifications."
        }
      ]
    },
    {
      id: "interviews",
      title: "Interview Prep & Questions",
      faqs: [
        {
          q: "What typical interview questions should I prepare for?",
          a: "While questions depend on your field, you should always prepare for core corporate questions like: 'Tell me about a time you solved a complex problem under pressure', 'Why do you want to join our organization?', and 'How do you prioritize your daily workflow?'"
        },
        {
          q: "Does Project Find help me prepare for the actual interview?",
          a: "Yes. Once we secure and deliver your verified interview invitation, we provide you with a tailored preparation guide outlining typical questions and company insights to help you ace the meeting."
        },
        {
          q: "What happens if I do not pass the interview?",
          a: "Our promise is to secure you a verified interview invite. Once that invite is delivered, the current ₦3,000 cycle is complete. If you do not pass and would like us to manage another application cycle for you, you can easily start a new one from your dashboard."
        }
      ]
    }
  ]

  const toggleFaq = (uniqueId) => {
    setActiveFaq(activeFaq === uniqueId ? null : uniqueId)
  }

  // Filter FAQs based on search input
  const filteredCategories = categories.map(cat => ({
    ...cat,
    faqs: cat.faqs.filter(faq => 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.faqs.length > 0)

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white pb-24">
      
      {/* HEADER Nav bar */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-stone-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="h-11 w-11 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg overflow-hidden shrink-0 relative">
            <span className="text-[11px] font-bold text-white tracking-tighter lowercase absolute">project</span>
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
            Project Find
          </span>
        </div>
        
        <button 
          onClick={() => router.push('/')}
          className="text-sm font-semibold text-stone-300 hover:text-amber-400 transition"
        >
          Back to Home
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-8 text-center space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-stone-300 max-w-xl mx-auto text-sm md:text-base font-medium">
          Have questions about payment verification, recruitment pipelines, or interview prep? Find quick answers below.
        </p>

        {/* SEARCH BAR */}
        <div className="max-w-lg mx-auto pt-6">
          <input 
            type="text" 
            placeholder="Search questions or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-4 bg-stone-900/50 border border-stone-800 focus:border-amber-500/50 rounded-2xl text-stone-200 text-sm focus:outline-none transition-all placeholder-stone-500 font-medium"
          />
        </div>
      </section>

      {/* FAQ ACCORDION LIST */}
      <section className="max-w-3xl mx-auto px-6 mt-12 space-y-12">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.id} className="space-y-4">
              <h2 className="text-xs font-mono font-bold text-amber-400 tracking-wider uppercase border-b border-stone-900/80 pb-2">
                {category.title}
              </h2>
              <div className="space-y-3">
                {category.faqs.map((faq, index) => {
                  const uniqueId = `${category.id}-${index}`
                  const isOpen = activeFaq === uniqueId
                  return (
                    <div 
                      key={index} 
                      className="bg-stone-900/20 border border-stone-900 rounded-2xl overflow-hidden transition shadow-md"
                    >
                      <button 
                        onClick={() => toggleFaq(uniqueId)}
                        className="w-full text-left px-6 py-5 font-bold text-stone-100 hover:text-white flex justify-between items-center text-sm md:text-base"
                      >
                        <span>{faq.q}</span>
                        <span className="text-lg text-stone-400 ml-4 shrink-0">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-6 text-sm text-stone-300 leading-relaxed border-t border-stone-900/60 pt-4 font-medium">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-stone-500 font-medium text-sm">No matching questions found. Try search keywords like "payment" or "questions".</p>
          </div>
        )}
      </section>

      {/* CTA CARD */}
      <section className="max-w-3xl mx-auto px-6 mt-16">
        <div className="p-8 rounded-2xl border border-stone-900 bg-stone-900/20 text-center space-y-4">
          <h3 className="text-lg font-bold text-white">Still have questions?</h3>
          <p className="text-stone-400 text-xs md:text-sm font-medium">
            Our support desk is always active and happy to clarify how our recruitment scouts assist you.
          </p>
          <button 
            onClick={() => router.push('/contact')}
            className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-950 font-bold text-xs rounded-xl transition"
          >
            Contact Support
          </button>
        </div>
      </section>

    </div>
  )
}