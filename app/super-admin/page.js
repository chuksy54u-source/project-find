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

let supabaseInstance
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
  const [allStaffCodes, setAllStaffCodes] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all') // 'all' | 'admin' | 'staff'

  // Covert Operations State
  const [covertStaffCode, setCovertStaffCode] = useState(null)
  const [covertDropdownOpen, setCovertDropdownOpen] = useState(false)

  // Live Countdowns State
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    // Verify Super Admin Privileges
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

    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [router])

  // Fetch all personnel & collect unique staff codes
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

      const { data: codeData } = await supabase
        .from('profiles')
        .select('staff_code')
        .not('staff_code', 'is', null)

      if (codeData) {
        const uniqueCodes = Array.from(
          new Set(
            codeData
              .map(item => item.staff_code?.trim().toUpperCase())
              .filter(Boolean)
          )
        ).sort()
        setAllStaffCodes(uniqueCodes)
      }
    } catch (err) {
      console.error("Failed to load staff profiles:", err)
    } finally {
      setLoading(false)
    }
  }

  // Helper: Format Work Duration
  const calculateWorkDuration = (startedAt) => {
    if (!startedAt) return { status: 'Not Started', elapsed: 'N/A' }

    const startDate = new Date(startedAt)
    const diffMs = now - startDate

    if (diffMs < 0) {
      const futureMs = Math.abs(diffMs)
      const hours = Math.floor(futureMs / (1000 * 60 * 60))
      const mins = Math.floor((futureMs % (1000 * 60 * 60)) / (1000 * 60))
      const secs = Math.floor((futureMs % (1000 * 60)) / 1000)
      return { 
        status: 'Scheduled', 
        elapsed: `Starts in ${hours}h ${mins}m ${secs}s` 
      }
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000)

    let formatted = ''
    if (days > 0) formatted += `${days}d `
    formatted += `${hours}h ${mins}m ${secs}s`

    return { status: 'Active Shift', elapsed: formatted }
  }

  // Helper: Render Work Report Preview (Universal Multi-Document & Spreadsheet Viewer)
  const renderReportContent = (report) => {
    if (!report) {
      return (
        <div className="bg-stone-950 p-4 rounded-xl border border-stone-850 text-xs text-stone-500 italic">
          No active submission available on staff_report.
        </div>
      )
    }

    const trimmed = report.trim()
    const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')

    if (isUrl) {
      const lower = trimmed.toLowerCase()

      // 1. IMAGE VIEWER (.png, .jpg, .jpeg, .gif, .webp, .svg)
      if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(lower)) {
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-sky-950/40 p-3.5 rounded-xl border border-sky-800/40">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-sky-400">IMG</span>
                <div>
                  <span className="text-xs font-bold text-sky-400 block">Submitted Image Attachment</span>
                  <span className="text-[10px] text-stone-400 truncate max-w-sm sm:max-w-md block">
                    {trimmed}
                  </span>
                </div>
              </div>
              <a
                href={trimmed}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5"
              >
                [ View Fullscreen ]
              </a>
            </div>
            <div className="w-full max-h-[500px] bg-stone-950 rounded-xl border border-stone-850 overflow-hidden flex items-center justify-center p-4">
              <img 
                src={trimmed} 
                alt="Report Image" 
                className="max-h-[460px] w-auto object-contain rounded-lg border border-stone-800" 
              />
            </div>
          </div>
        )
      }

      // 2. GOOGLE SHEETS / DOCS / SLIDES VIEWER
      if (lower.includes('docs.google.com') || lower.includes('sheets.google.com')) {
        let previewUrl = trimmed
        if (trimmed.includes('/edit')) {
          previewUrl = trimmed.replace(/\/edit.*$/, '/preview')
        } else if (trimmed.includes('/view')) {
          previewUrl = trimmed.replace(/\/view.*$/, '/preview')
        } else if (!trimmed.endsWith('/preview')) {
          previewUrl = `${trimmed}/preview`
        }

        const isSheet = lower.includes('spreadsheets') || lower.includes('sheets.google.com')
        const isDoc = lower.includes('document')
        const isSlide = lower.includes('presentation')

        const label = isSheet ? 'Google Sheets Workbook' : isDoc ? 'Google Doc' : isSlide ? 'Google Slides Presentation' : 'Google Workspace File'

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/40">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-emerald-400">DOC</span>
                <div>
                  <span className="text-xs font-bold text-emerald-400 block">{label}</span>
                  <span className="text-[10px] text-stone-400 truncate max-w-sm sm:max-w-md block">
                    {trimmed}
                  </span>
                </div>
              </div>
              <a
                href={trimmed}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5"
              >
                [ Open Document ]
              </a>
            </div>
            <div className="w-full h-[500px] bg-stone-950 rounded-xl border border-stone-850 overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Google Workspace Document Preview"
              />
            </div>
          </div>
        )
      }

      // 3. EXCEL SPREADSHEETS (.xlsx, .xls, .csv)
      if (/\.(xlsx|xls|csv)(\?.*)?$/i.test(lower)) {
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(trimmed)}`
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/40">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-emerald-400">XLS</span>
                <div>
                  <span className="text-xs font-bold text-emerald-400 block">Excel / CSV Spreadsheet</span>
                  <span className="text-[10px] text-stone-400 truncate max-w-sm sm:max-w-md block">
                    {trimmed}
                  </span>
                </div>
              </div>
              <a
                href={trimmed}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5"
              >
                [ Download Spreadsheet ]
              </a>
            </div>
            <div className="w-full h-[500px] bg-stone-950 rounded-xl border border-stone-850 overflow-hidden">
              <iframe
                src={officeViewerUrl}
                className="w-full h-full border-0"
                title="Excel Spreadsheet Viewer"
              />
            </div>
          </div>
        )
      }

      // 4. MICROSOFT WORD (.doc, .docx) & POWERPOINT (.ppt, .pptx)
      if (/\.(docx?|pptx?)(\?.*)?$/i.test(lower)) {
        const isWord = /\.(docx?)(\?.*)?$/i.test(lower)
        const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(trimmed)}`
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-blue-950/40 p-3.5 rounded-xl border border-blue-800/40">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-blue-400">{isWord ? 'DOC' : 'PPT'}</span>
                <div>
                  <span className="text-xs font-bold text-blue-400 block">
                    {isWord ? 'Microsoft Word Document' : 'Microsoft PowerPoint Presentation'}
                  </span>
                  <span className="text-[10px] text-stone-400 truncate max-w-sm sm:max-w-md block">
                    {trimmed}
                  </span>
                </div>
              </div>
              <a
                href={trimmed}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5"
              >
                [ Download Document ]
              </a>
            </div>
            <div className="w-full h-[500px] bg-stone-950 rounded-xl border border-stone-850 overflow-hidden">
              <iframe
                src={officeViewerUrl}
                className="w-full h-full border-0"
                title="Office Document Viewer"
              />
            </div>
          </div>
        )
      }

      // 5. PDF DOCUMENTS (.pdf)
      if (lower.includes('.pdf')) {
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-amber-950/40 p-3.5 rounded-xl border border-amber-800/40">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-amber-400">PDF</span>
                <div>
                  <span className="text-xs font-bold text-amber-400 block">Submitted PDF Document</span>
                  <span className="text-[10px] text-stone-400 truncate max-w-sm sm:max-w-md block">
                    {trimmed}
                  </span>
                </div>
              </div>
              <a
                href={trimmed}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5"
              >
                [ Open PDF ]
              </a>
            </div>
            <div className="w-full h-[500px] bg-stone-950 rounded-xl border border-stone-850 overflow-hidden">
              <iframe
                src={trimmed}
                className="w-full h-full border-0"
                title="PDF Report Preview"
              />
            </div>
          </div>
        )
      }

      // 6. UNIVERSAL FALLBACK VIEWER (Google Docs Embed Previewer for General Docs/Links)
      const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(trimmed)}&embedded=true`

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-stone-900 p-3.5 rounded-xl border border-stone-800">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-amber-400">WEB</span>
              <div>
                <span className="text-xs font-bold text-amber-400 block">Submitted Web Document / Link</span>
                <a
                  href={trimmed}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-400 underline font-mono break-all hover:text-amber-300 block max-w-sm sm:max-w-md"
                >
                  {trimmed}
                </a>
              </div>
            </div>
            <a
              href={trimmed}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5"
            >
              [ Open Link ]
            </a>
          </div>
          <div className="w-full h-[450px] bg-stone-950 rounded-xl border border-stone-850 overflow-hidden">
            <iframe
              src={googleDocsViewerUrl}
              className="w-full h-full border-0"
              title="Universal Document Preview"
            />
          </div>
        </div>
      )
    }

    // Plain Text Report
    return (
      <div className="bg-stone-950 p-4 rounded-xl border border-stone-850 text-xs text-stone-200 whitespace-pre-wrap leading-relaxed">
        {trimmed}
      </div>
    )
  }

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
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-300 text-sm font-mono">
        Loading Super Admin Management Portal...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white">
      <div className="h-1 bg-gradient-to-r from-purple-600 via-amber-500 to-amber-700 w-full" />

      {/* --- COVERT OPERATIONS OVERLAY / PORTAL --- */}
      {covertStaffCode ? (
        <CovertAdminPortal 
          staffCode={covertStaffCode}
          allStaffCodes={allStaffCodes}
          onSwitchStaffCode={(code) => setCovertStaffCode(code)}
          onCloseCovert={() => setCovertStaffCode(null)}
        />
      ) : (
        /* --- STANDARD SUPER ADMIN COMMAND CENTER --- */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

          {/* HEADER WITH COVERT OPERATIONS DROPDOWN */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-900/40 p-6 rounded-3xl border border-stone-900 backdrop-blur-md relative">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Super Admin Command Center</p>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">Staff Management & Reports</h1>
            </div>

            <div className="flex items-center gap-3 flex-wrap relative">
              <div className="relative">
                <button 
                  onClick={() => setCovertDropdownOpen(!covertDropdownOpen)}
                  className="px-4 py-2.5 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 text-xs font-black rounded-xl transition flex items-center gap-2 shadow-lg shadow-purple-950/40"
                >
                  <span>Covert Operations</span>
                  <span className="text-[10px] bg-purple-900/80 px-1.5 py-0.5 rounded text-purple-200">
                    v
                  </span>
                </button>

                {covertDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-stone-900 border border-purple-800/50 rounded-2xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl">
                    <div className="px-3 py-2 border-b border-stone-800">
                      <p className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Select Staff Code Portal</p>
                      <p className="text-[9px] text-stone-500">Access full candidate & interview controls</p>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-stone-850/50">
                      {allStaffCodes.length === 0 ? (
                        <div className="p-3 text-[11px] text-stone-500 italic">No active staff codes found.</div>
                      ) : (
                        allStaffCodes.map((code) => (
                          <button
                            key={code}
                            onClick={() => {
                              setCovertStaffCode(code)
                              setCovertDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-mono font-bold text-stone-200 hover:text-purple-300 hover:bg-purple-950/40 rounded-lg transition flex items-center justify-between"
                          >
                            <span>Code: <strong className="text-amber-400">{code}</strong></span>
                            <span className="text-[10px] text-stone-500 font-sans">[ Inspect ]</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={fetchAllStaffData}
                className="px-4 py-2.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-amber-500 text-xs font-bold rounded-xl transition"
              >
                Refresh Data
              </button>
            </div>
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
                      const reportLower = staff.staff_report?.toLowerCase() || ''
                      
                      const isGoogleSheets = reportLower.includes('docs.google.com/spreadsheets') || reportLower.includes('sheets.google.com')
                      const isExcel = /\.(xlsx|xls|csv)(\?.*)?$/i.test(reportLower)
                      const isWord = /\.(docx?)(\?.*)?$/i.test(reportLower)
                      const isImage = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(reportLower)
                      const isPdf = reportLower.includes('.pdf')

                      return (
                        <tr key={staff.id} className="hover:bg-stone-950/40">
                          <td className="py-4">
                            <div className="font-bold text-white">{staff.full_name || 'Unnamed Personnel'}</div>
                            <div className="text-[10px] text-stone-500">{staff.email || 'No Email'}</div>
                            <div className="text-[10px] text-stone-500">{staff.phone_number || 'No Phone'}</div>
                          </td>

                          <td className="py-4 font-mono font-bold text-amber-500">
                            {staff.staff_code ? (
                              <button 
                                onClick={() => setCovertStaffCode(staff.staff_code.trim().toUpperCase())}
                                className="hover:underline flex items-center gap-1 group"
                                title="Open Covert Portal for this Staff Code"
                              >
                                <span>{staff.staff_code}</span>
                                <span className="text-[9px] opacity-0 group-hover:opacity-100 text-purple-400 pl-1">[Open]</span>
                              </button>
                            ) : (
                              <span className="text-stone-600 font-sans italic">Unassigned</span>
                            )}
                          </td>

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

                          <td className="py-4 max-w-xs">
                            {staff.staff_report ? (
                              <div className="bg-stone-950 p-2 rounded-lg border border-stone-850">
                                {isGoogleSheets ? (
                                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                    [ Google Sheets Attached ]
                                  </span>
                                ) : isExcel ? (
                                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                    [ Excel Spreadsheet File ]
                                  </span>
                                ) : isWord ? (
                                  <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                                    [ Word Document Attached ]
                                  </span>
                                ) : isImage ? (
                                  <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                                    [ Image Attachment ]
                                  </span>
                                ) : isPdf ? (
                                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                                    [ PDF Report Attached ]
                                  </span>
                                ) : (
                                  <p className="line-clamp-2 text-[11px] text-stone-400">
                                    {staff.staff_report}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-stone-600 italic text-[10px]">No report submitted yet</span>
                            )}
                          </td>

                          <td className="py-4 text-right space-x-2">
                            {staff.staff_code && (
                              <button 
                                onClick={() => setCovertStaffCode(staff.staff_code.trim().toUpperCase())}
                                className="px-2.5 py-1.5 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-800/50 rounded-lg text-[10px] font-bold"
                                title="Operate as this staff code"
                              >
                                Covert Portal
                              </button>
                            )}
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
      )}

      {/* --- INSPECTION MODAL WITH UNIVERSAL DOCUMENT & SPREADSHEET VIEWER --- */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-4xl w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6 max-h-[92vh] overflow-y-auto">
            
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

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Submitted Work Report & Attachment Viewer</h3>
              {renderReportContent(selectedStaff.staff_report)}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-stone-950/50 p-4 rounded-xl border border-stone-850 text-xs">
              <div>
                <span className="text-stone-500 block text-[10px]">Target Role</span>
                <span className="text-stone-200 font-semibold">{selectedStaff.target_role || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Sector</span>
                <span className="text-stone-200 font-semibold">{selectedStaff.sector || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Experience</span>
                <span className="text-stone-200 font-semibold">
                  {selectedStaff.years_of_experience ? `${selectedStaff.years_of_experience} Yrs` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Work Mode</span>
                <span className="text-stone-200 font-semibold">{selectedStaff.preferred_work_mode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Expected Salary</span>
                <span className="text-stone-200 font-semibold">
                  {selectedStaff.expected_salary ? `${selectedStaff.salary_currency || ''} ${selectedStaff.expected_salary}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Location</span>
                <span className="text-stone-200 font-semibold">
                  {selectedStaff.location_city ? `${selectedStaff.location_city}, ${selectedStaff.location_country}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Employment Status</span>
                <span className="text-stone-200 font-semibold">{selectedStaff.employment_status || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Notice Period</span>
                <span className="text-stone-200 font-semibold">{selectedStaff.notice_period || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Relocation</span>
                <span className="text-stone-200 font-semibold">
                  {selectedStaff.willing_to_relocate ? 'Willing' : (selectedStaff.willing_to_relocate === false ? 'Not Willing' : 'N/A')}
                </span>
              </div>
            </div>
            
            {/* Primary Skills Viewer */}
            {selectedStaff.primary_skills && selectedStaff.primary_skills.length > 0 && (
              <div className="space-y-1">
                <span className="text-stone-500 block text-[10px]">Primary Skills</span>
                <div className="flex flex-wrap gap-2">
                  {selectedStaff.primary_skills.map((skill, idx) => (
                    <span key={idx} className="bg-stone-900 border border-stone-800 text-stone-300 px-2 py-0.5 rounded text-[10px]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedStaff.bio_summary && (
              <div className="space-y-1">
                <span className="text-stone-500 block text-[10px]">Bio Summary</span>
                <p className="text-xs text-stone-300 bg-stone-950/40 p-3 rounded-lg border border-stone-850">{selectedStaff.bio_summary}</p>
              </div>
            )}

            <div className="flex gap-4 text-xs pt-2">
              {selectedStaff.linkedin_url && (
                <a href={selectedStaff.linkedin_url} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline font-bold">
                  [ LinkedIn Profile ]
                </a>
              )}
              {selectedStaff.portfolio_url && (
                <a href={selectedStaff.portfolio_url} target="_blank" rel="noreferrer" className="text-amber-500 hover:underline font-bold">
                  [ Portfolio Website ]
                </a>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

// =========================================================================
// --- COVERT OPERATIONS ADMIN PORTAL SUB-COMPONENT (READING FROM CVS TABLE) ---
// =========================================================================
function CovertAdminPortal({ staffCode, allStaffCodes, onSwitchStaffCode, onCloseCovert }) {
  const [loading, setLoading] = useState(true)
  
  // Dashboard Metrics
  const [profiles, setProfiles] = useState([])
  const [paidCandidates, setPaidCandidates] = useState([])
  const [pendingPayments, setPendingPayments] = useState([])
  const [interviews, setInterviews] = useState([])
  const [cvsList, setCvsList] = useState([]) // Direct state for `cvs` table records
  const [selectedCandidate, setSelectedCandidate] = useState(null) // Added for expanded view

  // UI Interactive States
  const [activeTab, setActiveTab] = useState('payments')
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [savingInterviewId, setSavingInterviewId] = useState(null)
  
  // Dynamic Input States for Interviews
  const [meetingInputs, setMeetingInputs] = useState({}) 
  const [companyInputs, setCompanyInputs] = useState({})
  const [roleInputs, setRoleInputs] = useState({})
  const [dateInputs, setDateInputs] = useState({})
  const [notesInputs, setNotesInputs] = useState({})
  const [cvFileInputs, setCvFileInputs] = useState({})
  const [attachmentInputs, setAttachmentInputs] = useState({}) // ADDED STATE FOR ATTACHMENTS

  useEffect(() => {
    fetchDashboardData(staffCode)
  }, [staffCode])

  const fetchDashboardData = async (targetCode) => {
    setLoading(true)
    try {
      if (!targetCode) return

      const normalizedCode = targetCode.trim().toUpperCase()

      // 1. Fetch pending payments filtered by target staff_code
      const { data: paymentsData, error: paymentsErr } = await supabase
        .from('payments')
        .select(`*, profiles!inner(full_name, email, phone_number, staff_code)`)
        .eq('status', 'pending')
        .ilike('profiles.staff_code', normalizedCode)
        .order('created_at', { ascending: false })

      if (paymentsErr) console.error("Covert Fetch Payments Error:", paymentsErr)

      // 2. Fetch candidate profiles filtered by target staff_code
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('staff_code', normalizedCode)
        .order('updated_at', { ascending: false })

      let cleanCandidateProfiles = []
      let verifiedPaidOnly = []

      if (profilesErr) {
        console.error("Covert Fetch Profiles Error:", profilesErr)
      } else if (profilesData) {
        cleanCandidateProfiles = profilesData.filter(p => !p.is_admin && !p.is_crm && !p.is_super_admin && !p.is_staff)
        setProfiles(cleanCandidateProfiles)

        verifiedPaidOnly = cleanCandidateProfiles.filter(p => p.payment_status?.toLowerCase() === 'paid')
        setPaidCandidates(verifiedPaidOnly)
      }

      // 3. Fetch interviews filtered by target staff_code including ALL new profile fields
      let { data: interviewsData, error: interviewsErr } = await supabase
        .from('interviews')
        .select(`*, profiles!inner(id, full_name, email, phone_number, payment_status, interests, staff_code, sector, target_role, years_of_experience, employment_status, notice_period, preferred_work_mode, expected_salary, salary_currency, location_city, location_country, willing_to_relocate, primary_skills, linkedin_url, portfolio_url, bio_summary)`)
        .ilike('profiles.staff_code', normalizedCode)
        .order('created_at', { ascending: false })

      if (interviewsErr) console.error("Covert Fetch Interviews Error:", interviewsErr)

      // 4. READ DIRECTLY FROM THE `cvs` TABLE
      const { data: cvsData, error: cvsErr } = await supabase
        .from('cvs')
        .select('id, email, file_name, bucket_path, cv_url, created_at, user_id, name')
        .order('created_at', { ascending: false })

      if (cvsErr) {
        console.error("Covert Fetch CVS Table Error:", cvsErr)
      } else {
        setCvsList(cvsData || [])
      }

      // 5. Auto-initialize interview records for candidates missing one
      if (verifiedPaidOnly.length > 0) {
        const existingInterviewUserIds = new Set((interviewsData || []).map(i => i.user_id))
        const missingCandidates = verifiedPaidOnly.filter(p => !existingInterviewUserIds.has(p.id))

        if (missingCandidates.length > 0) {
          const rowsToInsert = missingCandidates.map(c => ({
            user_id: c.id,
            status: 'pending'
          }))

          const { error: insertErr } = await supabase.from('interviews').insert(rowsToInsert)

          if (!insertErr) {
            const { data: refreshedInterviews } = await supabase
              .from('interviews')
              .select(`*, profiles!inner(id, full_name, email, phone_number, payment_status, interests, staff_code, sector, target_role, years_of_experience, employment_status, notice_period, preferred_work_mode, expected_salary, salary_currency, location_city, location_country, willing_to_relocate, primary_skills, linkedin_url, portfolio_url, bio_summary)`)
              .ilike('profiles.staff_code', normalizedCode)
              .order('created_at', { ascending: false })

            if (refreshedInterviews) interviewsData = refreshedInterviews
          }
        }
      }

      setPendingPayments(paymentsData || [])
      setInterviews(interviewsData || [])

      // Initialize inputs
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
      console.error("Unexpected error in Covert Admin view:", err)
    } finally {
      setLoading(false)
    }
  }

  // Helper: Get candidate CVs from the `cvs` table by user_id or email
  const getCandidateCvs = (candidateUserId, candidateEmail) => {
    return cvsList.filter((cv) => {
      const matchUserId = cv.user_id && candidateUserId && cv.user_id === candidateUserId
      const matchEmail = cv.email && candidateEmail && cv.email.toLowerCase().trim() === candidateEmail.toLowerCase().trim()
      return matchUserId || matchEmail
    })
  }

  // Handle payment approval/rejection
  const handlePaymentResolution = async (paymentId, userId, newStatus) => {
    const confirmation = window.confirm(`[COVERT ACTION] Resolve payment for code (${staffCode}) as: ${newStatus.toUpperCase()}?`)
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

      alert(`Payment marked as ${newStatus}.`)
      fetchDashboardData(staffCode)
    } catch (err) {
      console.error("DATABASE ERROR:", err)
      alert(`Operation failed: ${err?.message || "Check logs"}`)
    }
  }

  // Save interview schedule & upload CV (inserts record to both Storage and `cvs` table)
  const handleCreateOrUpdateInterview = async (interviewId, candidateUserId, candidateEmail, candidateName) => {
    setSavingInterviewId(interviewId)
    try {
      const company = companyInputs[interviewId] || null
      const role = roleInputs[interviewId] || null
      const date = dateInputs[interviewId] ? new Date(dateInputs[interviewId]).toISOString() : null
      const link = meetingInputs[interviewId] || null
      const notesVal = notesInputs[interviewId] || null
      const selectedCvFile = cvFileInputs[interviewId]
      const selectedAttachments = attachmentInputs[interviewId] || [] // ADDED

      let uploadedCvUrl = null
      let uploadedBucketPath = null
      let uploadedAttachmentUrls = [] // ADDED

      if (selectedCvFile) {
        const fileExt = selectedCvFile.name.split('.').pop()
        const filePath = `resumes/${candidateUserId}_${Date.now()}.${fileExt}`

        let { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, selectedCvFile, { upsert: true })

        if (uploadError) {
          const { error: fallbackErr } = await supabase.storage
            .from('cvs')
            .upload(filePath, selectedCvFile, { upsert: true })

          if (fallbackErr) {
            throw new Error("Failed to upload CV file. Check bucket permissions.")
          } else {
            const { data: pubUrl } = supabase.storage.from('cvs').getPublicUrl(filePath)
            uploadedCvUrl = pubUrl.publicUrl
            uploadedBucketPath = `cvs/${filePath}`
          }
        } else {
          const { data: pubUrl } = supabase.storage.from('resumes').getPublicUrl(filePath)
          uploadedCvUrl = pubUrl.publicUrl
          uploadedBucketPath = `resumes/${filePath}`
        }

        // Insert new CV entry into `cvs` table
        if (uploadedCvUrl) {
          await supabase.from('cvs').insert({
            user_id: candidateUserId || null,
            email: candidateEmail || null,
            name: candidateName || selectedCvFile.name,
            file_name: selectedCvFile.name,
            bucket_path: uploadedBucketPath,
            cv_url: uploadedCvUrl,
          })
        }
      }

      // ADDED: UPLOAD MULTIPLE ATTACHMENTS
      if (selectedAttachments.length > 0) {
        for (const file of selectedAttachments) {
          const fileExt = file.name.split('.').pop()
          const filePath = `interview_attachments/${interviewId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('cvs') // using the same cvs bucket for attachments
            .upload(filePath, file, { upsert: true })

          if (!uploadError) {
            const { data: pubUrl } = supabase.storage.from('cvs').getPublicUrl(filePath)
            uploadedAttachmentUrls.push(pubUrl.publicUrl)
          }
        }
      }

      const updateData = {
        company_name: company,
        role_title: role,
        interview_date: date,
        meeting_link: link,
        notes: notesVal,
        status: 'scheduled'
      }

      if (uploadedCvUrl) updateData.cv_url = uploadedCvUrl

      // ADDED: APPEND MULTIPLE ATTACHMENT URLS
      if (uploadedAttachmentUrls.length > 0) {
        const existingUrls = interviews.find(i => i.id === interviewId)?.attachments_url || []
        updateData.attachments_url = [...existingUrls, ...uploadedAttachmentUrls]
      }

      const { error } = await supabase
        .from('interviews')
        .update(updateData)
        .eq('id', interviewId)

      if (error) throw error

      alert("Interview details and candidate files updated successfully!")
      fetchDashboardData(staffCode)
    } catch (err) {
      console.error("Save Interview Error:", err)
      alert(`Failed to save: ${err?.message || "Unknown error"}`)
    } finally {
      setSavingInterviewId(null)
    }
  }

  // Reset recruitment cycle for target staff code
  const handleGlobalReset = async () => {
    const confirmation = window.confirm(`[COVERT ACTION] Purge interviews, payments, and reset candidate profiles for staff code (${staffCode})?`)
    if (!confirmation) return

    try {
      const candidateIds = profiles.map(p => p.id)

      if (candidateIds.length > 0) {
        await supabase.from('interviews').delete().in('user_id', candidateIds)
        await supabase.from('payments').delete().in('user_id', candidateIds)
        await supabase
          .from('profiles')
          .update({ payment_status: 'unpaid' })
          .ilike('staff_code', staffCode)
          .eq('is_admin', false)
      }

      alert(`Recruitment cycle for code ${staffCode} has been reset.`)
      fetchDashboardData(staffCode)
    } catch (err) {
      console.error(err)
      alert("Cycle reset encountered errors.")
    }
  }

  const tabLabels = {
    payments: `Pending Payments (${pendingPayments.length})`,
    interviews: `Schedules & Interviews (${interviews.length})`,
    candidates: `Verified Profiles (${paidCandidates.length})`
  }

  const handleSelectTab = (tab) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* CONTROL BAR */}
      <div className="bg-purple-950/40 border border-purple-500/50 p-4 sm:p-6 rounded-3xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-black rounded uppercase tracking-widest animate-pulse">
                Covert Operations Portal Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Admin Portal: <span className="text-amber-400 font-mono underline">{staffCode}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
            <div className="flex items-center gap-2 bg-stone-900/90 border border-purple-500/40 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-stone-400 font-bold">Switch Code:</span>
              <select
                value={staffCode}
                onChange={(e) => onSwitchStaffCode(e.target.value)}
                className="bg-transparent text-amber-400 font-mono font-bold text-xs focus:outline-none cursor-pointer"
              >
                {allStaffCodes.map(code => (
                  <option key={code} value={code} className="bg-stone-900 text-stone-200">
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleGlobalReset}
              className="px-3 py-2 bg-red-950/40 border border-red-900/60 hover:bg-red-900/60 text-red-300 text-xs font-bold rounded-xl transition"
            >
              Reset Cycle ({staffCode})
            </button>

            <button 
              onClick={onCloseCovert}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-bold rounded-xl transition"
            >
              Exit Covert View
            </button>
          </div>
        </div>
      </div>

      {/* TABS (DESKTOP) */}
      <div className="hidden md:flex border-b border-stone-900 gap-6">
        {['payments', 'interviews', 'candidates'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === tab ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* HAMBURGER MENU (MOBILE ONLY) */}
      <div className="block md:hidden">
        <div className="relative">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between bg-stone-900 border border-purple-800/60 px-4 py-3 rounded-xl text-amber-500 text-xs font-bold tracking-wider uppercase shadow-lg"
          >
            <span className="flex items-center gap-2">
              <span className="text-stone-400 font-normal">Tab:</span>
              {tabLabels[activeTab]}
            </span>
            <svg 
              className="w-5 h-5 text-amber-500 transition-transform duration-200" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-stone-900/95 border border-purple-800/60 rounded-xl overflow-hidden shadow-2xl z-40 backdrop-blur-lg divide-y divide-stone-850">
              <button
                onClick={() => handleSelectTab('payments')}
                className={`w-full text-left px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider transition ${
                  activeTab === 'payments' ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' : 'text-stone-400 hover:bg-stone-850'
                }`}
              >
                {tabLabels.payments}
              </button>
              <button
                onClick={() => handleSelectTab('interviews')}
                className={`w-full text-left px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider transition ${
                  activeTab === 'interviews' ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' : 'text-stone-400 hover:bg-stone-850'
                }`}
              >
                {tabLabels.interviews}
              </button>
              <button
                onClick={() => handleSelectTab('candidates')}
                className={`w-full text-left px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider transition ${
                  activeTab === 'candidates' ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' : 'text-stone-400 hover:bg-stone-850'
                }`}
              >
                {tabLabels.candidates}
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-purple-400 font-mono">
          Loading portal data for staff code [{staffCode}]...
        </div>
      ) : (
        <main className="min-h-[500px]">
          
          {/* TAB 1: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="bg-stone-900/20 border border-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-4">Pending Proof Submissions ({staffCode})</h2>
              
              {pendingPayments.length === 0 ? (
                <div className="text-center py-12 text-xs text-stone-500 font-medium">
                  No manual bank transfer verifications pending right now for staff code: {staffCode}.
                </div>
              ) : (
                <>
                  {/* MOBILE STACKED CARDS VIEW */}
                  <div className="block md:hidden space-y-4">
                    {pendingPayments.map((p) => (
                      <div key={p.id} className="bg-stone-950/60 border border-stone-850 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-white text-sm">{p.profiles?.full_name || 'N/A'}</p>
                            <p className="text-[11px] text-stone-400">{p.profiles?.email || 'Unknown'}</p>
                            <p className="text-[10px] text-stone-500">{p.profiles?.phone_number || 'No phone'}</p>
                          </div>
                          <p className="font-extrabold text-amber-500 text-sm">₦{p.amount ? p.amount.toLocaleString() : '0'}</p>
                        </div>
                        <div className="text-[10px] text-stone-500 flex justify-between items-center pt-2 border-t border-stone-900">
                          <span>Sender: <strong className="text-stone-300">{p.sender_name}</strong></span>
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                          <button 
                            onClick={() => setSelectedReceiptUrl(p.receipt_url)}
                            className="w-full py-2 bg-stone-900 hover:bg-stone-850 text-amber-500 border border-stone-800 rounded-lg text-xs font-bold"
                          >
                            View Receipt
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => handlePaymentResolution(p.id, p.user_id, 'approved')}
                              className="py-2 bg-green-950/40 text-green-400 border border-green-900/30 rounded-lg text-xs font-bold text-center"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handlePaymentResolution(p.id, p.user_id, 'rejected')}
                              className="py-2 bg-red-950/40 text-red-400 border border-red-900/30 rounded-lg text-xs font-bold text-center"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP TABLE VIEW */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-stone-850 text-stone-500 font-bold uppercase tracking-wider">
                          <th className="pb-3">Candidate</th>
                          <th className="pb-3">Email & Contact</th>
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
                            <td className="py-4 font-bold text-white">{p.profiles?.full_name || 'N/A'}</td>
                            <td className="py-4 text-stone-400">
                              <div>{p.profiles?.email || 'Unknown'}</div>
                              <div className="text-[10px] text-stone-500">{p.profiles?.phone_number || 'No phone'}</div>
                            </td>
                            <td className="py-4 font-bold text-white">{p.sender_name}</td>
                            <td className="py-4 font-bold text-amber-500">₦{p.amount ? p.amount.toLocaleString() : '0'}</td>
                            <td className="py-4 text-[10px] text-stone-500">{new Date(p.created_at).toLocaleString()}</td>
                            <td className="py-4">
                              <button 
                                onClick={() => setSelectedReceiptUrl(p.receipt_url)}
                                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-amber-500 border border-stone-850 rounded-lg text-[10px] font-black"
                              >
                                View Receipt
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
                </>
              )}
            </div>
          )}

          {/* TAB 2: INTERVIEWS & CVS (READS FROM CVS TABLE) */}
          {activeTab === 'interviews' && (
            <div className="bg-stone-900/20 border border-stone-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-4">Interviews Pipeline & Candidate CV Management ({staffCode})</h2>
              
              {interviews.length === 0 ? (
                <div className="text-center py-12 text-xs text-stone-500 font-medium">
                  No candidates assigned to staff code: {staffCode}.
                </div>
              ) : (
                <>
                  {/* MOBILE INTERVIEWS CARDS */}
                  <div className="block md:hidden space-y-4">
                    {interviews.map((i) => {
                      const candidateUserId = i.user_id || i.profiles?.id
                      const candidateEmail = i.profiles?.email
                      const matchedCvs = getCandidateCvs(candidateUserId, candidateEmail)

                      return (
                        <div key={i.id} className="bg-stone-950/60 border border-stone-850 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-white text-sm">{i.profiles?.full_name || 'N/A'}</p>
                              <p className="text-[11px] text-stone-400">{i.profiles?.email || 'N/A'}</p>
                              <p className="text-[10px] text-stone-500">{i.profiles?.phone_number || 'N/A'}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              i.status === 'scheduled' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
                            }`}>
                              {i.status ? i.status.replace('_', ' ') : 'pending'}
                            </span>
                          </div>

                          {/* Render CV list from `cvs` table */}
                          <div className="pt-1 space-y-2 border-t border-stone-900">
                            <label className="block text-[10px] font-bold text-stone-400 uppercase">
                              Candidate CV Files ({matchedCvs.length}):
                            </label>

                            {matchedCvs.length > 0 ? (
                              <div className="space-y-1.5">
                                {matchedCvs.map((cv) => (
                                  <div key={cv.id} className="bg-stone-900 p-2 rounded-lg border border-stone-800 flex items-center justify-between">
                                    <div className="truncate pr-2">
                                      <p className="text-[11px] font-bold text-amber-400 truncate">
                                        [DOC] {cv.file_name || cv.name || 'CV Document'}
                                      </p>
                                      <p className="text-[9px] text-stone-500">
                                        {cv.created_at ? new Date(cv.created_at).toLocaleDateString() : ''}
                                      </p>
                                    </div>
                                    <a
                                      href={cv.cv_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold shrink-0"
                                    >
                                      View CV
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : i.cv_url ? (
                              <a 
                                href={i.cv_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 rounded-lg text-xs font-bold"
                              >
                                Download Legacy CV
                              </a>
                            ) : (
                              <span className="text-stone-600 italic text-[10px] block">No CV on file in database</span>
                            )}

                            <div className="pt-2">
                              <label className="block text-[10px] font-bold text-amber-400 mb-1 uppercase">
                                Upload / Attach New CV:
                              </label>
                              <input 
                                type="file"
                                accept=".pdf, .doc, .docx"
                                onChange={(e) => setCvFileInputs({...cvFileInputs, [i.id]: e.target.files[0]})}
                                className="w-full text-xs text-stone-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-stone-800 file:text-stone-200"
                              />
                            </div>
                            
                            {/* ADDED: MOBILE MULTIPLE ATTACHMENTS VIEW & UPLOAD */}
                            {i.attachments_url && i.attachments_url.length > 0 && (
                              <div className="pt-2">
                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">
                                  Current Attachments ({i.attachments_url.length}):
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {i.attachments_url.map((url, idx) => (
                                    <a 
                                      key={idx} 
                                      href={url} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="text-[9px] bg-stone-900 border border-stone-800 px-2 py-0.5 rounded text-amber-500 hover:bg-stone-850 truncate max-w-[150px]"
                                    >
                                      [ File {idx + 1} ]
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="pt-2 mt-2 border-t border-stone-900/50">
                              <label className="block text-[10px] font-bold text-amber-400 uppercase mb-1">
                                Upload Multiple Attachments:
                              </label>
                              <input 
                                type="file"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(e.target.files)
                                  setAttachmentInputs({...attachmentInputs, [i.id]: files})
                                }}
                                className="w-full text-xs text-stone-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-stone-800 file:text-stone-200"
                              />
                            </div>
                          </div>

                          {/* Dynamic Inputs */}
                          <div className="space-y-2 pt-2 border-t border-stone-900">
                            <input 
                              type="text"
                              placeholder="Company Name"
                              value={companyInputs[i.id] || ''}
                              onChange={(e) => setCompanyInputs({...companyInputs, [i.id]: e.target.value})}
                              className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                            <input 
                              type="text"
                              placeholder="Role Title"
                              value={roleInputs[i.id] || ''}
                              onChange={(e) => setRoleInputs({...roleInputs, [i.id]: e.target.value})}
                              className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                            <input 
                              type="datetime-local"
                              value={dateInputs[i.id] || ''}
                              onChange={(e) => setDateInputs({...dateInputs, [i.id]: e.target.value})}
                              className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
                            />
                            <input 
                              type="text"
                              placeholder="Meeting Link"
                              value={meetingInputs[i.id] || ''}
                              onChange={(e) => setMeetingInputs({...meetingInputs, [i.id]: e.target.value})}
                              className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                            <textarea 
                              placeholder="Additional Notes"
                              value={notesInputs[i.id] || ''}
                              onChange={(e) => setNotesInputs({...notesInputs, [i.id]: e.target.value})}
                              rows={2}
                              className="w-full bg-stone-950 border border-stone-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                            />
                          </div>

                          <button 
                            onClick={() => handleCreateOrUpdateInterview(
                              i.id, 
                              candidateUserId, 
                              candidateEmail, 
                              i.profiles?.full_name
                            )}
                            disabled={savingInterviewId === i.id}
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-extrabold transition disabled:bg-stone-800 disabled:text-stone-500"
                          >
                            {savingInterviewId === i.id ? "Saving Details & Uploading CV..." : "Save Details & Files"}
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* DESKTOP TABLE VIEW */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-stone-850 text-stone-500 font-bold uppercase tracking-wider">
                          <th className="pb-3">Candidate Info</th>
                          <th className="pb-3">Contact</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 max-w-[240px]">Candidate Resumes & Attachments</th>
                          <th className="pb-3">Scheduling Data Inputs</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-900/60 font-medium text-stone-300">
                        {interviews.map((i) => {
                          const candidateUserId = i.user_id || i.profiles?.id
                          const candidateEmail = i.profiles?.email
                          const matchedCvs = getCandidateCvs(candidateUserId, candidateEmail)

                          return (
                            <tr key={i.id} className="hover:bg-stone-950/20 align-top">
                              <td className="py-4">
                                <div className="font-bold text-white">{i.profiles?.full_name || 'N/A'}</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {i.profiles?.interests && i.profiles.interests.length > 0 ? (
                                    i.profiles.interests.map((int, idx) => (
                                      <span key={idx} className="bg-stone-950 border border-stone-850 text-stone-400 px-1.5 py-0.5 rounded text-[8px]">
                                        {int}
                                      </span>
                                    ))
                                  ) : null}
                                </div>
                              </td>
                              <td className="py-4 text-stone-400">
                                <div>{i.profiles?.email || 'N/A'}</div>
                                <div className="text-[10px] text-stone-500">{i.profiles?.phone_number || 'N/A'}</div>
                              </td>
                              <td className="py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                  i.status === 'scheduled' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
                                }`}>
                                  {i.status ? i.status.replace('_', ' ') : 'pending'}
                                </span>
                              </td>

                              {/* --- CVS & ATTACHMENTS SECTION --- */}
                              <td className="py-4 space-y-2 max-w-[240px]">
                                {matchedCvs.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {matchedCvs.map((cv) => (
                                      <div key={cv.id} className="bg-stone-950 p-2 rounded-lg border border-stone-850 space-y-1">
                                        <div className="flex justify-between items-start gap-1">
                                          <span className="font-bold text-amber-400 text-[10px] truncate block" title={cv.file_name || cv.name}>
                                            [DOC] {cv.file_name || cv.name || 'CV Document'}
                                          </span>
                                          <a 
                                            href={cv.cv_url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-bold shrink-0"
                                          >
                                            View
                                          </a>
                                        </div>
                                        {cv.created_at && (
                                          <span className="text-[8px] text-stone-500 block">
                                            Uploaded: {new Date(cv.created_at).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : i.cv_url ? (
                                  <a 
                                    href={i.cv_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-white rounded-lg text-[10px] font-bold"
                                  >
                                    Download Legacy CV
                                  </a>
                                ) : (
                                  <span className="text-stone-600 italic text-[10px] block">No CV found in `cvs` table</span>
                                )}

                                <div className="pt-1">
                                  <label className="block text-[9px] font-bold text-amber-400 uppercase mb-1">
                                    Upload / Attach CV:
                                  </label>
                                  <input 
                                    type="file"
                                    accept=".pdf, .doc, .docx"
                                    onChange={(e) => setCvFileInputs({...cvFileInputs, [i.id]: e.target.files[0]})}
                                    className="w-full text-[10px] text-stone-400 file:mr-1 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-stone-800 file:text-stone-200 cursor-pointer"
                                  />
                                </div>

                                {/* ADDED: DESKTOP MULTIPLE ATTACHMENTS VIEW & UPLOAD */}
                                {i.attachments_url && i.attachments_url.length > 0 && (
                                  <div className="pt-2 border-t border-stone-800/50 mt-2">
                                    <label className="block text-[9px] font-bold text-stone-400 uppercase mb-1">
                                      Current Attachments ({i.attachments_url.length}):
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {i.attachments_url.map((url, idx) => (
                                        <a 
                                          key={idx} 
                                          href={url} 
                                          target="_blank" 
                                          rel="noreferrer" 
                                          className="text-[9px] bg-stone-900 border border-stone-800 px-2 py-0.5 rounded text-amber-500 hover:bg-stone-850 truncate max-w-[150px]"
                                        >
                                          [ File {idx + 1} ]
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-1 mt-2 border-t border-stone-800/50">
                                  <label className="block text-[9px] font-bold text-amber-400 uppercase mb-1">
                                    Upload Multiple Attachments:
                                  </label>
                                  <input 
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files)
                                      setAttachmentInputs({...attachmentInputs, [i.id]: files})
                                    }}
                                    className="w-full text-[10px] text-stone-400 file:mr-1 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-stone-800 file:text-stone-200 cursor-pointer"
                                  />
                                </div>
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
                                  onClick={() => handleCreateOrUpdateInterview(
                                    i.id, 
                                    candidateUserId, 
                                    candidateEmail, 
                                    i.profiles?.full_name
                                  )}
                                  disabled={savingInterviewId === i.id}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 rounded-lg text-[10px] font-black transition"
                                >
                                  {savingInterviewId === i.id ? "Saving..." : "Save Details"}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: VERIFIED CANDIDATES */}
          {activeTab === 'candidates' && (
            <div className="bg-stone-900/20 border border-stone-900 rounded-2xl sm:rounded-3xl overflow-hidden p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-950/50 border border-stone-900 rounded-2xl p-4 flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Registered Candidates ({staffCode})</p>
                  <p className="text-2xl sm:text-3xl font-black text-white mt-1">{profiles.length}</p>
                </div>
                <div className="bg-emerald-950/10 border border-emerald-900/20 rounded-2xl p-4 flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">Verified & Paid Candidates</p>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{paidCandidates.length}</p>
                </div>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-white mb-4">Verified Paid Candidates Directory ({staffCode})</h2>
                
                {paidCandidates.length === 0 ? (
                  <div className="text-center py-12 text-xs text-stone-500 font-medium">
                    No paid candidates under staff code: {staffCode}.
                  </div>
                ) : (
                  <>
                    {/* MOBILE CANDIDATE CARDS */}
                    <div className="block md:hidden space-y-3">
                      {paidCandidates.map((p) => (
                        <div 
                          key={p.id} 
                          onClick={() => setSelectedCandidate(p)}
                          className="bg-stone-950/60 border border-stone-850 rounded-xl p-4 space-y-2 cursor-pointer hover:bg-stone-900 transition"
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-white text-sm">{p.full_name || 'N/A'}</p>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-green-500/10 text-green-400 border border-green-500/20">
                              {p.payment_status || 'unpaid'}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-stone-400">{p.email || 'N/A'}</p>
                          <p className="text-[10px] text-stone-500">{p.phone_number || 'N/A'}</p>
                          
                          <div className="py-2 space-y-1">
                            <p className="text-[11px] text-stone-300 font-bold">{p.target_role || 'Target Role N/A'}</p>
                            <p className="text-[10px] text-stone-500">{p.sector || 'Sector N/A'} • {p.years_of_experience ? `${p.years_of_experience} Yrs` : 'Exp N/A'}</p>
                            <p className="text-[10px] text-stone-500">Relocation: {p.willing_to_relocate ? 'Yes' : (p.willing_to_relocate === false ? 'No' : 'N/A')} • {p.employment_status || 'Status N/A'}</p>
                          </div>

                          <div className="pt-2 border-t border-stone-900 flex justify-between items-center">
                             <div className="flex flex-wrap gap-1">
                              {p.primary_skills && p.primary_skills.length > 0 ? (
                                p.primary_skills.slice(0, 2).map((skill, idx) => (
                                  <span key={idx} className="bg-purple-900/30 border border-purple-800/50 text-purple-300 px-2 py-0.5 rounded text-[9px]">
                                    {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-stone-600 italic text-[10px]">No skills listed</span>
                              )}
                            </div>
                            <span className="text-[10px] text-amber-500 font-bold">[ View Profile ]</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* DESKTOP CANDIDATE TABLE */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-stone-850 text-stone-500 font-bold uppercase tracking-wider">
                            <th className="pb-3">Candidate Details</th>
                            <th className="pb-3">Contact & Location</th>
                            <th className="pb-3">Professional Profile</th>
                            <th className="pb-3">Compensation & Status</th>
                            <th className="pb-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-900/60 font-medium text-stone-300">
                          {paidCandidates.map((p) => (
                            <tr 
                              key={p.id} 
                              onClick={() => setSelectedCandidate(p)}
                              className="hover:bg-stone-950/40 cursor-pointer align-top transition-colors"
                            >
                              <td className="py-4">
                                <div className="font-bold text-white">{p.full_name || 'N/A'}</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {p.primary_skills?.slice(0, 3).map((skill, idx) => (
                                    <span key={idx} className="bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded text-[8px] border border-purple-800/50">
                                      {skill}
                                    </span>
                                  ))}
                                  {p.primary_skills?.length > 3 && (
                                    <span className="text-[8px] text-stone-500">+{p.primary_skills.length - 3}</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 text-stone-400">
                                <div>{p.email || 'N/A'}</div>
                                <div className="text-[10px] text-stone-500">{p.phone_number || 'N/A'}</div>
                                {(p.location_city || p.location_country) && (
                                  <div className="text-[10px] text-amber-500/70 mt-0.5">
                                    [Loc] {p.location_city}, {p.location_country}
                                  </div>
                                )}
                              </td>
                              <td className="py-4">
                                <div className="font-semibold text-stone-200 text-[11px]">{p.target_role || 'Role N/A'}</div>
                                <div className="text-[10px] text-stone-400 mt-0.5">
                                  {p.sector || 'Sector N/A'} • {p.years_of_experience ? `${p.years_of_experience} Yrs` : 'Exp N/A'}
                                </div>
                                <div className="text-[9px] text-stone-500 mt-0.5 flex gap-2">
                                  <span>{p.employment_status || 'Status N/A'}</span>
                                  <span>• Relocate: {p.willing_to_relocate ? 'Yes' : (p.willing_to_relocate === false ? 'No' : 'N/A')}</span>
                                </div>
                              </td>
                              <td className="py-4">
                                <div className="text-[11px] font-bold text-emerald-400">
                                  {p.expected_salary ? `${p.salary_currency || ''} ${p.expected_salary}` : 'Salary N/A'}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-black bg-green-500/10 text-green-400 border border-green-500/20">
                                    {p.payment_status || 'unpaid'}
                                  </span>
                                  {p.linkedin_url && (
                                    <a href={p.linkedin_url} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-[10px]">
                                      [in]
                                    </a>
                                  )}
                                  {p.portfolio_url && (
                                    <a href={p.portfolio_url} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-pink-400 hover:underline text-[10px]">
                                      [Port]
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 text-right">
                                <button className="px-3 py-1.5 bg-stone-900 text-amber-500 border border-stone-800 rounded-lg text-[10px] font-black">
                                  View Profile
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* LIGHTBOX FOR PROOF RECEIPT PREVIEW */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center p-4 sm:p-6 z-50 animate-fade-in">
          <div className="max-w-2xl w-full flex justify-end mb-2">
            <button 
              onClick={() => setSelectedReceiptUrl(null)}
              className="text-white hover:text-amber-500 text-xs sm:text-sm font-black uppercase tracking-wider"
            >
              [ Close Lightbox ]
            </button>
          </div>
          <div className="max-w-2xl w-full bg-stone-900 border border-stone-850 rounded-2xl p-2 sm:p-4 overflow-hidden shadow-2xl flex justify-center">
            <img 
              src={selectedReceiptUrl} 
              alt="Payment verification proof" 
              className="max-h-[70vh] object-contain rounded-lg shadow-inner"
            />
          </div>
        </div>
      )}

      {/* EXTENDED VIEW MODAL FOR VERIFIED CANDIDATE */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-4xl w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            
            <div className="flex justify-between items-start border-b border-stone-850 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedCandidate.full_name || 'Unnamed Candidate'}</h2>
                <p className="text-xs text-amber-500 font-mono mt-0.5">
                  Code: {selectedCandidate.staff_code || 'N/A'} • {selectedCandidate.email} • {selectedCandidate.phone_number || 'No Phone'}
                </p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-black bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wider">
                  Status: {selectedCandidate.payment_status || 'unpaid'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="text-stone-400 hover:text-white text-xs font-bold uppercase tracking-wider"
              >
                [ Close ]
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-stone-950/50 p-4 rounded-xl border border-stone-850 text-xs">
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Target Role</span>
                <span className="text-stone-200 font-semibold">{selectedCandidate.target_role || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Sector</span>
                <span className="text-stone-200 font-semibold">{selectedCandidate.sector || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Experience</span>
                <span className="text-stone-200 font-semibold">
                  {selectedCandidate.years_of_experience ? `${selectedCandidate.years_of_experience} Yrs` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Work Mode</span>
                <span className="text-stone-200 font-semibold">{selectedCandidate.preferred_work_mode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Expected Salary</span>
                <span className="text-stone-200 font-semibold text-emerald-400">
                  {selectedCandidate.expected_salary ? `${selectedCandidate.salary_currency || ''} ${selectedCandidate.expected_salary}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Location</span>
                <span className="text-stone-200 font-semibold">
                  {selectedCandidate.location_city ? `${selectedCandidate.location_city}, ${selectedCandidate.location_country}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Employment Status</span>
                <span className="text-stone-200 font-semibold">{selectedCandidate.employment_status || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Notice Period</span>
                <span className="text-stone-200 font-semibold">{selectedCandidate.notice_period || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase">Relocation</span>
                <span className="text-stone-200 font-semibold">
                  {selectedCandidate.willing_to_relocate ? 'Willing' : (selectedCandidate.willing_to_relocate === false ? 'Not Willing' : 'N/A')}
                </span>
              </div>
            </div>
            
            {selectedCandidate.primary_skills && selectedCandidate.primary_skills.length > 0 && (
              <div className="space-y-2">
                <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Primary Skills</span>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.primary_skills.map((skill, idx) => (
                    <span key={idx} className="bg-purple-900/30 border border-purple-800/50 text-purple-300 px-3 py-1 rounded-lg text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedCandidate.bio_summary && (
              <div className="space-y-2">
                <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Bio Summary</span>
                <p className="text-xs text-stone-300 bg-stone-950/40 p-4 rounded-xl border border-stone-850 leading-relaxed">
                  {selectedCandidate.bio_summary}
                </p>
              </div>
            )}

            <div className="flex gap-4 text-xs pt-4 border-t border-stone-850">
              {selectedCandidate.linkedin_url ? (
                <a href={selectedCandidate.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-bold transition">
                  [ LinkedIn Profile ]
                </a>
              ) : (
                <span className="text-stone-600 font-mono">[ No LinkedIn ]</span>
              )}
              
              {selectedCandidate.portfolio_url ? (
                <a href={selectedCandidate.portfolio_url} target="_blank" rel="noreferrer" className="text-pink-400 hover:text-pink-300 font-bold transition">
                  [ Portfolio Website ]
                </a>
              ) : (
                <span className="text-stone-600 font-mono">[ No Portfolio ]</span>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}