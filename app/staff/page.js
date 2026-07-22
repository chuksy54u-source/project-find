"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function StaffDashboard() {
  const router = useRouter()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [staffProfile, setStaffProfile] = useState(null)
  const [recruits, setRecruits] = useState([])
  
  // Work Cycle & Timer State
  const [workStartedAt, setWorkStartedAt] = useState(null)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: false })
  
  // Report Submission State
  const [reportInput, setReportInput] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [reportSuccess, setReportSuccess] = useState('')

  // 1. Fetch Current Staff User & Recruits
  useEffect(() => {
    async function loadStaffData() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profile?.is_staff) {
        // Not a staff member
        alert("Access Denied: You are not authorized as staff.")
        router.push('/')
        return
      }

      setStaffProfile(profile)
      setReportInput(profile.staff_report || '')
      setWorkStartedAt(profile.work_started_at)

      // Fetch all users recruited by this staff code (excluding the staff member themselves)
      if (profile.staff_code) {
        const { data: recruitedUsers } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone_number, interests, payment_status, updated_at')
          .eq('staff_code', profile.staff_code)
          .neq('id', user.id)
          .order('updated_at', { ascending: false })

        setRecruits(recruitmentUsers || recruitedUsers || [])
      }

      setLoading(false)
    }

    loadStaffData()
  }, [router])

  // 2. 7-Day Countdown Timer Logic
  useEffect(() => {
    if (!workStartedAt) return

    const calculateTime = () => {
      const now = new Date().getTime()
      const startTime = new Date(workStartedAt).getTime()
      const targetTime = startTime + (7 * 24 * 60 * 60 * 1000) // 7 days in milliseconds
      const diff = targetTime - now

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOverdue: true })
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft({ days, hours, minutes, seconds, isOverdue: false })
      }
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)
    return () => clearInterval(interval)
  }, [workStartedAt])

  // Start 7-Day Work Cycle
  const handleStartWork = async () => {
    const nowIso = new Date().toISOString()
    const { error } = await supabase
      .from('profiles')
      .update({ work_started_at: nowIso })
      .eq('id', staffProfile.id)

    if (!error) {
      setWorkStartedAt(nowIso)
    } else {
      alert("Failed to start work cycle.")
    }
  }

  // Handle Report Submission (Google Sheets Link or File Upload)
  const handleReportSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    setReportSuccess('')

    let finalReportUrl = reportInput

    // If a file was uploaded instead of a link
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop()
      const filePath = `reports/${staffProfile.id}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('staff-reports')
        .upload(filePath, selectedFile)

      if (uploadError) {
        alert("File upload failed. Make sure the storage bucket 'staff-reports' exists.")
        setUploading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('staff-reports')
        .getPublicUrl(filePath)

      finalReportUrl = publicUrlData.publicUrl
    }

    // Save report URL/link into profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ staff_report: finalReportUrl })
      .eq('id', staffProfile.id)

    setUploading(false)

    if (updateError) {
      alert("Error saving report.")
    } else {
      setReportSuccess("Weekly report successfully submitted!")
      setReportInput(finalReportUrl)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-amber-400 font-bold">
        Loading Staff Portal...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white relative pb-20">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto px-6 py-6 border-b border-stone-900/60 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg">
            <span className="text-[10px] font-bold text-white lowercase">project</span>
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent">
            Project Find <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-2 font-mono">STAFF PORTAL</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-stone-300">
            Welcome, <strong className="text-white">{staffProfile?.full_name || 'Staff Member'}</strong>
          </span>
          <button 
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-stone-300 text-xs font-bold rounded-xl border border-stone-800 transition"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-10">

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-stone-950/90 border border-stone-850 p-6 rounded-2xl shadow-xl backdrop-blur-md">
            <span className="text-xs font-mono font-bold text-stone-400 uppercase">Assigned Staff Code</span>
            <div className="text-3xl font-black text-amber-400 mt-2 font-mono tracking-wider">
              {staffProfile?.staff_code || "NO CODE ASSIGNED"}
            </div>
            <p className="text-xs text-stone-400 mt-2">Share this code with users during signup to track referrals.</p>
          </div>

          <div className="bg-stone-950/90 border border-stone-850 p-6 rounded-2xl shadow-xl backdrop-blur-md">
            <span className="text-xs font-mono font-bold text-stone-400 uppercase">Total Candidates Recruited</span>
            <div className="text-3xl font-black text-white mt-2">
              {recruits.length} <span className="text-sm font-normal text-stone-400">users</span>
            </div>
            <p className="text-xs text-stone-400 mt-2">Total users signed up with your staff code.</p>
          </div>

          <div className="bg-stone-950/90 border border-stone-850 p-6 rounded-2xl shadow-xl backdrop-blur-md">
            <span className="text-xs font-mono font-bold text-stone-400 uppercase">Paid Candidates</span>
            <div className="text-3xl font-black text-emerald-400 mt-2">
              {recruits.filter(r => r.payment_status?.toLowerCase() === 'paid').length}
            </div>
            <p className="text-xs text-stone-400 mt-2">Users who completed the ₦3,000 service payment.</p>
          </div>

        </div>

        {/* WORK CYCLE COUNTER & REPORT SUBMISSION (SPLIT GRID) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 7-DAY TIMELINE COUNTER CARD */}
          <div className="lg:col-span-6 bg-stone-900/40 border border-stone-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Work Cycle Timer</span>
                <h2 className="text-2xl font-black text-white mt-1">7-Day Weekly Shift</h2>
              </div>
              {!workStartedAt && (
                <button
                  onClick={handleStartWork}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold rounded-xl transition shadow-lg shadow-amber-600/20 text-sm"
                >
                  Start Work
                </button>
              )}
            </div>

            {workStartedAt ? (
              <div className="space-y-4">
                {timeLeft.isOverdue ? (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold animate-pulse">
                    ⚠️ Your 7-day cycle has elapsed! Please submit your weekly report immediately.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800">
                      <div className="text-3xl font-black text-amber-400 font-mono">{timeLeft.days}</div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase mt-1">Days</div>
                    </div>
                    <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800">
                      <div className="text-3xl font-black text-amber-400 font-mono">{timeLeft.hours}</div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase mt-1">Hours</div>
                    </div>
                    <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800">
                      <div className="text-3xl font-black text-amber-400 font-mono">{timeLeft.minutes}</div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase mt-1">Mins</div>
                    </div>
                    <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800">
                      <div className="text-3xl font-black text-amber-400 font-mono">{timeLeft.seconds}</div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase mt-1">Secs</div>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-stone-400">
                  Cycle started on: {new Date(workStartedAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-stone-300 font-medium">
                Click <strong>"Start Work"</strong> above when starting your weekly recruitment shift to initiate your 7-day countdown.
              </p>
            )}
          </div>

          {/* WEEKLY REPORT SUBMISSION CARD */}
          <div className="lg:col-span-6 bg-stone-900/40 border border-stone-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md space-y-6">
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Staff Deliverables</span>
              <h2 className="text-2xl font-black text-white mt-1">Submit Weekly Report</h2>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-2">
                  Option 1: Paste Google Sheets / Spreadsheet Link
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={reportInput}
                  onChange={(e) => setReportInput(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="relative flex items-center justify-center border-t border-stone-800 pt-3">
                <span className="text-[10px] bg-stone-900 px-3 text-stone-500 font-mono">OR UPLOAD FILE</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-2">
                  Option 2: Upload Excel / CSV / PDF File
                </label>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls, .pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-stone-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-750"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 text-stone-950 font-extrabold rounded-xl transition text-sm shadow-md"
              >
                {uploading ? "Submitting Report..." : "Save Weekly Report"}
              </button>

              {reportSuccess && (
                <p className="text-xs text-emerald-400 font-bold mt-2">{reportSuccess}</p>
              )}
            </form>
          </div>

        </div>

        {/* RECRUITEES TABLE */}
        <section className="bg-stone-900/40 border border-stone-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">Your Recruits</h2>
              <p className="text-xs text-stone-400 mt-1">Users registered using your code: <strong>{staffProfile?.staff_code}</strong></p>
            </div>
            <div className="text-xs font-mono font-bold text-stone-400 bg-stone-950 px-4 py-2 rounded-xl border border-stone-800">
              Total: {recruits.length}
            </div>
          </div>

          {recruits.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-sm font-medium border border-dashed border-stone-800 rounded-2xl">
              No users have signed up with your staff code yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-300">
                <thead className="bg-stone-950 text-xs uppercase font-mono text-amber-400 border-b border-stone-800">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-xl">Full Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone Number</th>
                    <th className="px-6 py-4">Interests</th>
                    <th className="px-6 py-4">Payment Status</th>
                    <th className="px-6 py-4 rounded-tr-xl">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850/60">
                  {recruits.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-stone-900/50 transition">
                      <td className="px-6 py-4 font-bold text-stone-100">
                        {candidate.full_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-stone-300">
                        {candidate.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-stone-300">
                        {candidate.phone_number || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {Array.isArray(candidate.interests) 
                          ? candidate.interests.join(', ') 
                          : candidate.interests || 'None'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                          candidate.payment_status?.toLowerCase() === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {candidate.payment_status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-stone-400">
                        {candidate.updated_at ? new Date(candidate.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}