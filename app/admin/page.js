"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// --- Robust Supabase Client Initialization ---
const getCleanSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const supabaseUrl = getCleanSupabaseUrl()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabaseInstance;
const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  }
  return supabaseInstance
}

const supabase = getSupabase()

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState(null)
  
  // Dashboard Metrics
  const [profiles, setProfiles] = useState([]) // Stores all non-admin profiles (for total count)
  const [paidCandidates, setPaidCandidates] = useState([]) // Stores only verified paid candidates
  const [pendingPayments, setPendingPayments] = useState([])
  const [interviews, setInterviews] = useState([])

  // UI Interactive States
  const [activeTab, setActiveTab] = useState('payments') // 'payments' | 'interviews' | 'candidates'
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null)
  
  // Fully Editable Dynamic Input States
  const [meetingInputs, setMeetingInputs] = useState({}) 
  const [companyInputs, setCompanyInputs] = useState({})
  const [roleInputs, setRoleInputs] = useState({})
  const [dateInputs, setDateInputs] = useState({})
  const [notesInputs, setNotesInputs] = useState({})

  useEffect(() => {
    const verifyAdminSession = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !profile?.is_admin) {
        alert("Unauthorized access.")
        router.push('/dashboard')
        return
      }

      setAdminUser(profile)
      fetchDashboardData()
    }

    verifyAdminSession()
  }, [router])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Fetch pending payments with user details
      const { data: paymentsData, error: paymentsErr } = await supabase
        .from('payments')
        .select(`*, profiles(email)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (paymentsErr) console.error("Error fetching payments:", paymentsErr)

      // 2. Fetch interviews (Joins profiles to display dynamic Name and Email directly)
      const { data: interviewsData, error: interviewsErr } = await supabase
        .from('interviews')
        .select(`*, profiles(full_name, email)`)
        .order('created_at', { ascending: false })

      if (interviewsErr) console.error("Error fetching interviews:", interviewsErr)

      // 3. Fetch standard profiles cleanly
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })

      if (profilesErr) {
        console.error("Error fetching profiles:", profilesErr)
      } else if (profilesData) {
        // Safe JavaScript filter to exclude admin profiles
        const cleanCandidateProfiles = profilesData.filter(p => p.is_admin !== true)
        setProfiles(cleanCandidateProfiles)

        // Filter standard candidate profiles to strictly show PAID and VERIFIED candidates
        const verifiedPaidOnly = cleanCandidateProfiles.filter(p => p.payment_status === 'paid')
        setPaidCandidates(verifiedPaidOnly)
      }

      setPendingPayments(paymentsData || [])
      setInterviews(interviewsData || [])

      // Map database fields to UI inputs to make them editable
      if (interviewsData) {
        const initialCompanies = {}
        const initialRoles = {}
        const initialDates = {}
        const initialLinks = {}
        const initialNotes = {}

        interviewsData.forEach((i) => {
          initialCompanies[i.id] = i.company_name || ''
          initialRoles[i.id] = i.role_title || ''
          initialDates[i.id] = i.interview_date ? new Date(i.interview_date).toISOString().slice(0, 16) : ''
          initialLinks[i.id] = i.meeting_link || ''
          initialNotes[i.id] = i.notes || ''
        })

        setCompanyInputs(initialCompanies)
        setRoleInputs(initialRoles)
        setDateInputs(initialDates)
        setMeetingInputs(initialLinks)
        setNotesInputs(initialNotes)
      }

    } catch (err) {
      console.error("Unexpected error gathering dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- 1. VERIFY / REJECT MANUAL PAYMENT ---
  const handlePaymentResolution = async (paymentId, userId, newStatus) => {
    const confirmation = window.confirm(`Are you sure you want to resolve this payment as: ${newStatus.toUpperCase()}?`)
    if (!confirmation) return

    try {
      if (newStatus === 'approved') {
        const { error } = await supabase.rpc('approve_payment', {
          target_payment_id: paymentId,
          target_user_id: userId
        })
        if (error) throw error
      } else {
        const { error } = await supabase.rpc('reject_payment', {
          target_payment_id: paymentId,
          target_user_id: userId
        })
        if (error) throw error
      }

      alert(`Payment successfully marked as ${newStatus}.`)
      fetchDashboardData()
    } catch (err) {
      console.error("DATABASE ERROR:", err)
      alert(`Database mutation failed.\nReason: ${err?.message || "Check schema logs."}`)
    }
  }

  // --- 2. SEND MEETING & SAVE SCHEDULING DETAILS ---
  const handleCreateOrUpdateInterview = async (interviewId) => {
    const company = companyInputs[interviewId] || null
    const role = roleInputs[interviewId] || null
    const date = dateInputs[interviewId] ? new Date(dateInputs[interviewId]).toISOString() : null
    const link = meetingInputs[interviewId] || null
    const notesVal = notesInputs[interviewId] || null

    try {
      const { error } = await supabase
        .from('interviews')
        .update({
          company_name: company,
          role_title: role,
          interview_date: date,
          meeting_link: link,
          notes: notesVal,
          status: 'scheduled'
        })
        .eq('id', interviewId)

      if (error) throw error
      alert("Interview successfully updated.")
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      alert("Failed to update schedule updates.")
    }
  }

  // --- 3. RESET RECRUITMENT CYCLE ---
  const handleGlobalReset = async () => {
    const confirmation = window.confirm("⚠️ WARNING: This will purge current scheduled interviews, payments and reset workspace user profiles. Proceed?")
    if (!confirmation) return

    try {
      const { error: interviewErr } = await supabase
        .from('interviews')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (interviewErr) throw interviewErr

      const { error: paymentsErr } = await supabase
        .from('payments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      
      if (paymentsErr) throw paymentsErr

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ payment_status: 'unpaid' })
        .eq('is_admin', false)

      if (profileErr) throw profileErr

      alert("The system has been completely reset for the upcoming recruitment cycle.")
      fetchDashboardData()
    } catch (err) {
      console.error(err)
      alert("Cycle reset operation encountered errors.")
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-white text-sm">
        Loading Command Center...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white">
      <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 w-full" />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-900/40 p-6 rounded-3xl border border-stone-900 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Project Find Platform Admin</p>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mt-1">Command Control Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleGlobalReset}
              className="px-5 py-2.5 bg-red-950/20 border border-red-900/50 hover:bg-red-950/50 text-red-400 text-xs font-bold rounded-xl transition"
            >
              🔄 Reset Recruitment Cycle
            </button>
            <button 
              onClick={handleLogout}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800 text-xs font-bold rounded-xl transition"
            >
              Log Out
            </button>
          </div>
        </header>

        {/* TAB CONTROLS */}
        <div className="flex border-b border-stone-900 gap-6">
          <button 
            onClick={() => setActiveTab('payments')}
            className={`pb-4 text-xs font-black uppercase tracking-wider relative transition-all ${
              activeTab === 'payments' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            Pending Payments ({pendingPayments.length})
          </button>
          <button 
            onClick={() => setActiveTab('interviews')}
            className={`pb-4 text-xs font-black uppercase tracking-wider relative transition-all ${
              activeTab === 'interviews' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            Schedules & Interviews ({interviews.length})
          </button>
          <button 
            onClick={() => setActiveTab('candidates')}
            className={`pb-4 text-xs font-black uppercase tracking-wider relative transition-all ${
              activeTab === 'candidates' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            Verified Profiles ({paidCandidates.length})
          </button>
        </div>

        <main className="min-h-[500px]">
          
          {/* TAB 1: PENDING PAYMENTS LIST */}
          {activeTab === 'payments' && (
            <div className="bg-stone-900/20 border border-stone-900 rounded-3xl overflow-hidden p-6 space-y-4">
              <h2 className="text-lg font-bold text-white mb-4">Pending Proof Submissions</h2>
              
              {pendingPayments.length === 0 ? (
                <div className="text-center py-12 text-xs text-stone-500 font-medium">
                  No manual bank transfer verifications pending right now.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-850 text-stone-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">User / Email</th>
                        <th className="pb-3">Sender Name</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Submitted</th>
                        <th className="pb-3">Proof Receipt</th>
                        <th className="pb-3 text-right">Decisions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-900/60 font-medium text-stone-300">
                      {pendingPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-950/20">
                          <td className="py-4 text-stone-400">{p.profiles?.email || 'Unknown'}</td>
                          <td className="py-4 font-bold text-white">{p.sender_name}</td>
                          <td className="py-4">₦{p.amount.toLocaleString()}</td>
                          <td className="py-4 text-[10px] text-stone-500">
                            {new Date(p.created_at).toLocaleString()}
                          </td>
                          <td className="py-4">
                            <button 
                              onClick={() => setSelectedReceiptUrl(p.receipt_url)}
                              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-amber-500 border border-stone-850 rounded-lg text-[10px] font-black"
                            >
                              👀 View Receipt image
                            </button>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            <button 
                              onClick={() => handlePaymentResolution(p.id, p.user_id, 'approved')}
                              className="px-3 py-1.5 bg-green-950/40 hover:bg-green-900/30 text-green-400 border border-green-900/20 rounded-lg text-[10px] font-black"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handlePaymentResolution(p.id, p.user_id, 'rejected')}
                              className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-900/20 rounded-lg text-[10px] font-black"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCHEDULES & MEETINGS */}
          {activeTab === 'interviews' && (
            <div className="bg-stone-900/20 border border-stone-900 rounded-3xl overflow-hidden p-6 space-y-4">
              <h2 className="text-lg font-bold text-white mb-4">Interviews Pipeline</h2>
              
              {interviews.length === 0 ? (
                <div className="text-center py-12 text-xs text-stone-500 font-medium">
                  Approved payments automatically generate scheduler objects here. No candidates to display.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-850 text-stone-500 font-bold uppercase tracking-wider">
                        <th className="pb-3">Candidate</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Current Status</th>
                        <th className="pb-3">Candidate Resume</th>
                        <th className="pb-3">Scheduling Data Inputs</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-900/60 font-medium text-stone-300">
                      {interviews.map((i) => (
                        <tr key={i.id} className="hover:bg-stone-950/20 align-top">
                          <td className="py-4 font-bold text-white">{i.profiles?.full_name || 'N/A'}</td>
                          <td className="py-4 text-stone-400">{i.profiles?.email || 'N/A'}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              i.status === 'scheduled' 
                                ? 'bg-green-500/15 text-green-400' 
                                : 'bg-amber-500/15 text-amber-400'
                            }`}>
                              {i.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4">
                            {i.cv_url ? (
                              <a 
                                href={i.cv_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-white rounded-lg text-[10px] font-bold"
                              >
                                📥 Download CV
                              </a>
                            ) : (
                              <span className="text-stone-600 italic text-[10px]">No CV uploaded yet</span>
                            )}
                          </td>
                          
                          <td className="py-4 space-y-2 max-w-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="text"
                                placeholder="Company Name"
                                value={companyInputs[i.id] || ''}
                                onChange={(e) => setCompanyInputs({...companyInputs, [i.id]: e.target.value})}
                                className="bg-stone-950 border border-stone-850 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500"
                              />
                              <input 
                                type="text"
                                placeholder="Role Title"
                                value={roleInputs[i.id] || ''}
                                onChange={(e) => setRoleInputs({...roleInputs, [i.id]: e.target.value})}
                                className="bg-stone-950 border border-stone-850 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="datetime-local"
                                value={dateInputs[i.id] || ''}
                                onChange={(e) => setDateInputs({...dateInputs, [i.id]: e.target.value})}
                                className="bg-stone-950 border border-stone-850 rounded px-2 py-1 text-[11px] text-stone-300 focus:outline-none focus:border-amber-500"
                              />
                              <input 
                                type="text"
                                placeholder="Meeting Link"
                                value={meetingInputs[i.id] || ''}
                                onChange={(e) => setMeetingInputs({...meetingInputs, [i.id]: e.target.value})}
                                className="bg-stone-950 border border-stone-850 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <textarea 
                                placeholder="Additional Notes"
                                value={notesInputs[i.id] || ''}
                                onChange={(e) => setNotesInputs({...notesInputs, [i.id]: e.target.value})}
                                rows={2}
                                className="w-full bg-stone-950 border border-stone-850 rounded px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-amber-500 resize-none"
                              />
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleCreateOrUpdateInterview(i.id)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-[10px] font-black"
                            >
                              Save Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REGISTERED USERS DIRECTORY */}
          {activeTab === 'candidates' && (
            <div className="bg-stone-900/20 border border-stone-900 rounded-3xl overflow-hidden p-6 space-y-6">
              
              {/* TOP SUMMARY STATS BAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-stone-950/50 border border-stone-900 rounded-2xl p-4 flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Total Registered Candidates</p>
                  <p className="text-3xl font-black text-white mt-1">{profiles.length}</p>
                </div>
                <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-2xl p-4 flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">Verified & Paid Candidates</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1">{paidCandidates.length}</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white mb-4">Verified Paid Candidates Directory</h2>
                
                {paidCandidates.length === 0 ? (
                  <div className="text-center py-12 text-xs text-stone-500 font-medium">
                    No paid candidates exist on the platform yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-stone-850 text-stone-500 font-bold uppercase tracking-wider">
                          <th className="pb-3">Full Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Phone</th>
                          <th className="pb-3">Payment State</th>
                          <th className="pb-3">Interests Specified</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-900/60 font-medium text-stone-300">
                        {paidCandidates.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-950/20">
                            <td className="py-4 font-bold text-white">{p.full_name || 'N/A'}</td>
                            <td className="py-4 text-stone-400">{p.email || 'N/A'}</td>
                            <td className="py-4 text-stone-400">{p.phone_number || 'N/A'}</td>
                            <td className="py-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-green-500/10 text-green-400 border border-green-500/20">
                                {p.payment_status || 'unpaid'}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex flex-wrap gap-1">
                                {p.interests && p.interests.length > 0 ? (
                                  p.interests.map((int, idx) => (
                                    <span key={idx} className="bg-stone-900 border border-stone-800 text-stone-400 px-2 py-0.5 rounded text-[9px]">
                                      {int}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-stone-600 italic text-[10px]">None</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* --- RECEIPT PREVIEW LIGHTBOX --- */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-50 animate-fade-in">
          <div className="max-w-2xl w-full flex justify-end mb-2">
            <button 
              onClick={() => setSelectedReceiptUrl(null)}
              className="text-white hover:text-amber-500 text-sm font-black uppercase tracking-wider"
            >
              [ Close Lightbox ]
            </button>
          </div>
          <div className="max-w-2xl w-full bg-stone-900 border border-stone-850 rounded-2xl p-4 overflow-hidden shadow-2xl flex justify-center">
            <img 
              src={selectedReceiptUrl} 
              alt="Payment verification proof" 
              className="max-h-[70vh] object-contain rounded-lg shadow-inner"
            />
          </div>
        </div>
      )}
    </div>
  )
}