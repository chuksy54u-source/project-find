"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// --- Supabase Client Initialization ---
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

export default function SuperAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  
  // Data States
  const [staffMembers, setStaffMembers] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null) // For inspecting report / full details
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all') // 'all' | 'admin' | 'staff'

  // Time Tracker State for Live Countdowns
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    // 1. Verify Super Admin Access (Checks for is_super_admin)
    const verifyAccess = async () => {
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

      if (error || !profile?.is_super_admin) {
        alert("Unauthorized access. Super Admin privileges required.")
        router.push('/dashboard')
        return
      }

      setCurrentUser(profile)
      fetchAllStaffData()
    }

    verifyAccess()

    // Live Ticker for Countdowns
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [router])

  // 2. Fetch all personnel where is_admin = true OR is_staff = true OR is_super_admin = true
  const fetchAllStaffData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or('is_admin.eq.true,is_staff.eq.true,is_super_admin.eq.true')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setStaffMembers(data || [])
    } catch (err) {
      console.error("Failed to load staff profiles:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- Helper: Format Work Timeline & Live Duration ---
  const calculateWorkDuration = (startedAt) => {
    if (!startedAt) return { status: 'Not Started', elapsed: 'N/A' }

    const startDate = new Date(startedAt)
    const diffMs = now - startDate

    if (diffMs < 0) {
      // Scheduled for the future
      const futureMs = Math.abs(diffMs)
      const hours = Math.floor(futureMs / (1000 * 60 * 60))
      const mins = Math.floor((futureMs % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((futureMs % (1000 * 60)) / 1000)
      return { 
        status: 'Scheduled', 
        elapsed: `Starts in ${hours}h ${mins}m ${secs}s` 
      }
    }

    // Currently Active
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000)

    let formatted = ''
    if (days > 0) formatted += `${days}d `
    formatted += `${hours}h ${mins}m ${secs}s`

    return { status: 'Active Shift', elapsed: formatted }
  }

  // --- Filter Logic ---
  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch = 
      staff.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.staff_code?.toLowerCase().includes(searchQuery.toLowerCase())

    if (roleFilter === 'admin') return matchesSearch && (staff.is_admin || staff.is_super_admin)
    if (roleFilter === 'staff') return matchesSearch && staff.is_staff && !staff.is_admin && !staff.is_super_admin
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-300 text-sm">
        Loading Super Admin Management Portal...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white">
      <div className="h-1 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-900/40 p-6 rounded-3xl border border-stone-900 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Super Admin Command Center</p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">Staff Management & Reports</h1>
          </div>
          <button 
            onClick={fetchAllStaffData}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-amber-500 text-xs font-bold rounded-xl transition"
          >
            🔄 Refresh Data
          </button>
        </header>

        {/* SEARCH & FILTER BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text"
            placeholder="Search by name, email, or staff code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:col-span-2 bg-stone-900/60 border border-stone-850 rounded-xl px-4 py-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-stone-900/60 border border-stone-850 rounded-xl px-4 py-3 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Personnel ({staffMembers.length})</option>
            <option value="admin">Admins Only ({staffMembers.filter(s => s.is_admin || s.is_super_admin).length})</option>
            <option value="staff">Staff Only ({staffMembers.filter(s => s.is_staff && !s.is_admin && !s.is_super_admin).length})</option>
          </select>
        </div>

        {/* STAFF DIRECTORY TABLE */}
        <div className="bg-stone-900/20 border border-stone-900 rounded-3xl overflow-hidden p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-850 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="pb-3">Personnel</th>
                  <th className="pb-3">Staff Code</th>
                  <th className="pb-3">Role Status</th>
                  <th className="pb-3">Work Live Timer</th>
                  <th className="pb-3">Latest Report</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-900/60 font-medium text-stone-300">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-stone-500">
                      No staff records matched your query.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const timerInfo = calculateWorkDuration(staff.work_started_at)

                    return (
                      <tr key={staff.id} className="hover:bg-stone-950/40">
                        {/* 1. Name & Contact */}
                        <td className="py-4">
                          <div className="font-bold text-white">{staff.full_name || 'Unnamed Personnel'}</div>
                          <div className="text-[10px] text-stone-500">{staff.email || 'No Email'}</div>
                          <div className="text-[10px] text-stone-500">{staff.phone_number || 'No Phone'}</div>
                        </td>

                        {/* 2. Staff Code */}
                        <td className="py-4 font-mono font-bold text-amber-500">
                          {staff.staff_code ? staff.staff_code : <span className="text-stone-600 font-sans italic">Unassigned</span>}
                        </td>

                        {/* 3. Role Badges */}
                        <td className="py-4 space-x-1">
                          {staff.is_super_admin && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-500/15 text-red-400 border border-red-500/30">
                              SUPER ADMIN
                            </span>
                          )}
                          {staff.is_admin && !staff.is_super_admin && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              ADMIN
                            </span>
                          )}
                          {staff.is_staff && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              STAFF
                            </span>
                          )}
                          {staff.is_crm && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              CRM
                            </span>
                          )}
                        </td>

                        {/* 4. Live Timeline Countdown */}
                        <td className="py-4">
                          <div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              timerInfo.status === 'Active Shift' 
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                                : timerInfo.status === 'Scheduled' 
                                ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                                : 'bg-stone-900 text-stone-500'
                            }`}>
                              {timerInfo.status}
                            </span>
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-stone-300">
                            {timerInfo.elapsed}
                          </div>
                          {staff.work_started_at && (
                            <div className="text-[9px] text-stone-600">
                              Start: {new Date(staff.work_started_at).toLocaleString()}
                            </div>
                          )}
                        </td>

                        {/* 5. Report Preview */}
                        <td className="py-4 max-w-xs">
                          {staff.staff_report ? (
                            <p className="line-clamp-2 text-[11px] text-stone-400 bg-stone-950 p-2 rounded-lg border border-stone-850">
                              {staff.staff_report}
                            </p>
                          ) : (
                            <span className="text-stone-600 italic text-[10px]">No report submitted yet</span>
                          )}
                        </td>

                        {/* 6. Actions */}
                        <td className="py-4 text-right">
                          <button 
                            onClick={() => setSelectedStaff(staff)}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-amber-500 border border-stone-800 rounded-lg text-[10px] font-black"
                          >
                            Inspect & Review
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* --- STAFF INSPECTION & REPORT LIGHTBOX MODAL --- */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-3xl w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-stone-850 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedStaff.full_name || 'Unnamed Personnel'}</h2>
                <p className="text-xs text-amber-500 font-mono mt-0.5">
                  Code: {selectedStaff.staff_code || 'N/A'} • {selectedStaff.email}
                </p>
              </div>
              <button 
                onClick={() => setSelectedStaff(null)}
                className="text-stone-400 hover:text-white text-xs font-bold uppercase tracking-wider"
              >
                [ Close ]
              </button>
            </div>

            {/* Work Report Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Submitted Work Report</h3>
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-850 text-xs text-stone-200 whitespace-pre-wrap">
                {selectedStaff.staff_report || "No active submission available on staff_report."}
              </div>
            </div>

            {/* Professional & Work Mode Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-stone-950/50 p-4 rounded-xl border border-stone-850 text-xs">
              <div>
                <span className="text-stone-500 block text-[10px]">Target Role</span>
                <span className="text-stone-200 font-semibold">{selectedStaff.target_role || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Sector</span>
                <span className="text-stone-200 font-semibold">{selectedStaff.sector || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Work Mode</span>
                <span className="text-stone-200 font-semibold">{selectedStaff.preferred_work_mode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Location</span>
                <span className="text-stone-200 font-semibold">
                  {selectedStaff.location_city ? `${selectedStaff.location_city}, ${selectedStaff.location_country}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Experience</span>
                <span className="text-stone-200 font-semibold">
                  {selectedStaff.years_of_experience ? `${selectedStaff.years_of_experience} Yrs` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Expected Salary</span>
                <span className="text-stone-200 font-semibold">
                  {selectedStaff.expected_salary ? `${selectedStaff.salary_currency || ''} ${selectedStaff.expected_salary}` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Links & Bio */}
            {selectedStaff.bio_summary && (
              <div className="space-y-1">
                <span className="text-stone-500 block text-[10px]">Bio Summary</span>
                <p className="text-xs text-stone-300 bg-stone-950/40 p-3 rounded-lg border border-stone-850">{selectedStaff.bio_summary}</p>
              </div>
            )}

            <div className="flex gap-3 text-xs pt-2">
              {selectedStaff.linkedin_url && (
                <a href={selectedStaff.linkedin_url} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline font-bold">
                  🔗 LinkedIn
                </a>
              )}
              {selectedStaff.portfolio_url && (
                <a href={selectedStaff.portfolio_url} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline font-bold">
                  🌐 Portfolio
                </a>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}