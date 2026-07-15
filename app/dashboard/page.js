"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const getCleanSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const supabaseUrl = getCleanSupabaseUrl()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function DashboardPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [interviews, setInterviews] = useState([])
  
  const [selectedFile, setSelectedFile] = useState(null)
  const [cvRecord, setCvRecord] = useState(null) 
  const [cvSubmitting, setCvSubmitting] = useState(false)
  
  const [activeTab, setActiveTab] = useState('overview') 

  // --- CUSTOMER SERVICE BUBBLE STATE ---
  const [isCrmOpen, setIsCrmOpen] = useState(false)
  const [crmMessage, setCrmMessage] = useState('')
  const [crmSending, setCrmSending] = useState(false)
  const [crmSuccess, setCrmSuccess] = useState(false)

  // --- WHATSAPP CHAT HISTORY STATE ---
  const [crmHistory, setCrmHistory] = useState([])
  const [crmLoadingHistory, setCrmLoadingHistory] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          router.push('/login')
          return
        }

        setUser(authUser)

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError) {
          console.error("Error retrieving profile row:", profileError)
        } else {
          setProfile(profileData)
          
          const { data: cvData } = await supabase
            .from('cvs')
            .select('*')
            .eq('user_id', authUser.id)
            .single()

          if (cvData) {
            setCvRecord(cvData)
          }

          if (profileData.payment_status === 'paid') {
            const { data: interviewData, error: interviewError } = await supabase
              .from('interviews')
              .select('*')
              .eq('user_id', authUser.id)
              .order('created_at', { ascending: false })

            if (!interviewError && interviewData) {
              setInterviews(interviewData)
            } else {
              console.error("Error fetching interviews:", interviewError)
            }
          }
        }

      } catch (err) {
        console.error("Dashboard initialization error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  // --- FETCH CRM CHAT HISTORY ---
  const fetchCrmHistory = async () => {
    if (!user) return
    setCrmLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from('crm')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: true }) // Oldest messages first to build the chat top-to-bottom

      if (error) throw error
      if (data) setCrmHistory(data)
    } catch (err) {
      console.error("Error fetching chat history:", err)
    } finally {
      setCrmLoadingHistory(false)
    }
  }

  // Load chat history whenever the bubble is opened
  useEffect(() => {
    if (isCrmOpen) {
      fetchCrmHistory()
    }
  }, [isCrmOpen, user])

  // Auto-scroll to the newest message at the bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isCrmOpen) {
      scrollToBottom()
    }
  }, [crmHistory, isCrmOpen])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleCvUploadSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile || !user) return
    
    setCvSubmitting(true)

    try {
      const fileExt = selectedFile.name.split('.').pop()
      const cleanFileName = `${Date.now()}.${fileExt}`
      const bucketPath = `${user.id}/${cleanFileName}`

      const { data: storageData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(bucketPath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error("Storage Upload Error:", uploadError)
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(bucketPath)

      const { error: interviewUpdateError } = await supabase
        .from('interviews')
        .update({ cv_url: publicUrl })
        .eq('user_id', user.id)

      if (interviewUpdateError) {
        console.error("Interviews Table Update Error:", interviewUpdateError)
        throw new Error(`Interviews update failed: ${interviewUpdateError.message}`)
      }

      const userEmail = profile?.email || user.email || 'no-email@provided.com'
      const userName = profile?.full_name || user?.user_metadata?.full_name || 'Valued User'

      const cvMetadata = {
        user_id: user.id,
        name: userName,
        email: userEmail,
        file_name: selectedFile.name,
        bucket_path: bucketPath,
        cv_url: publicUrl
      }

      const { data: upsertData, error: cvUpsertError } = await supabase
        .from('cvs')
        .upsert(cvMetadata, { onConflict: 'user_id' })
        .select()
        .single()

      if (cvUpsertError) {
        console.error("Cvs Table Upsert Error:", cvUpsertError)
        throw new Error(`CV metadata save failed: ${cvUpsertError.message}`)
      }

      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      
      router.push('/submit-cv-success')
    } catch (err) {
      console.error("Comprehensive Error details:", err)
      alert(err.message || "Failed to process database changes after file upload.")
    } finally {
      setCvSubmitting(false)
    }
  }

  // --- SUBMIT CRM MESSAGE HANDLER ---
  const handleCrmSubmit = async (e) => {
    e.preventDefault()
    if (!crmMessage.trim() || !user) return

    setCrmSending(true)
    const currentMessageText = crmMessage.trim()
    setCrmMessage('') // Clear input field instantly for better UX

    try {
      const userEmail = profile?.email || user.email || 'no-email@provided.com'
      const userName = profile?.full_name || user?.user_metadata?.full_name || 'Valued User'

      const { data: newRow, error } = await supabase
        .from('crm')
        .insert({
          profile_id: user.id,
          name: userName,
          email: userEmail,
          message: currentMessageText,
          status: 'pending',
          message_type: 'cm' // Sets message type specifically to 'cm' for registered users
        })
        .select()
        .single()

      if (error) throw error

      // Push the newly sent message into the chat UI immediately
      if (newRow) {
        setCrmHistory((prev) => [...prev, newRow])
      }
      
    } catch (err) {
      console.error("Error submitting CRM message:", err)
      alert("Could not send your message. Please try again.")
      setCrmMessage(currentMessageText) // Put text back if it fails
    } finally {
      setCrmSending(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading System Dashboard...</p>
      </div>
    )
  }

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Valued User'
  const emailAddress = profile?.email || user?.email || 'N/A'
  const phoneNumber = profile?.phone_number || 'No phone registered'
  const paymentStatus = profile?.payment_status || 'unpaid'
  const activeInterests = profile?.interests || []

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white relative overflow-x-hidden flex flex-col justify-between">
      
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1800&auto=format&fit=crop" 
          alt="Premium background" 
          className="w-full h-full object-cover brightness-60 contrast-[1.1] saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/50 via-stone-950/95 to-stone-950 z-1"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-amber-500/5 blur-[140px] z-1"></div>
      </div>

      <header className="relative max-w-7xl mx-auto w-full px-6 py-4 flex flex-row items-center justify-between border-b border-stone-900/60 z-10 backdrop-blur-md bg-stone-950/40">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="h-9 w-9 bg-black rounded-full flex items-center justify-center border border-stone-850 shadow-lg relative shrink-0">
            <span className="text-[9px] font-bold text-white tracking-tighter lowercase absolute">project</span>
          </div>
          <span className="text-lg font-extrabold bg-gradient-to-r from-white via-stone-200 to-stone-400 bg-clip-text text-transparent tracking-tight">
            Project Find
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline-flex items-center gap-2 text-xs font-bold text-stone-400 bg-stone-900/80 border border-stone-850 px-3 py-1.5 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
            Safe & Secure Connection
          </span>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-stone-900/90 hover:bg-stone-850 text-stone-300 hover:text-white text-xs font-bold rounded-xl border border-stone-850 transition shadow-md"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="relative flex-grow max-w-7xl mx-auto w-full px-6 py-10 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-stone-950/85 backdrop-blur-md border border-stone-850/70 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-xl font-extrabold text-amber-400">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">{fullName}</h2>
                <p className="text-xs text-stone-400 font-medium">{emailAddress}</p>
              </div>
            </div>
          </div>

          <div className="bg-stone-950/85 backdrop-blur-md border border-stone-850/70 rounded-3xl p-3 shadow-xl space-y-1">
            <span className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold px-3 pt-2 pb-1">
              Menu
            </span>
            
            <button 
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-2xl transition text-left text-xs font-bold ${
                activeTab === 'overview' 
                  ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500' 
                  : 'text-stone-400 hover:bg-stone-900/50 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>My Status</span>
            </button>

            <button 
              onClick={() => setActiveTab('interviews')}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl transition text-left text-xs font-bold ${
                activeTab === 'interviews' 
                  ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500' 
                  : 'text-stone-400 hover:bg-stone-900/50 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>My Interviews</span>
              </div>
              {paymentStatus !== 'paid' && (
                <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded border border-stone-700">Locked</span>
              )}
            </button>

            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-2xl transition text-left text-xs font-bold ${
                activeTab === 'settings' 
                  ? 'bg-amber-500/10 text-amber-400 border-l-2 border-amber-500' 
                  : 'text-stone-400 hover:bg-stone-900/50 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>My Details</span>
            </button>
          </div>

          {paymentStatus === 'unpaid' && (
            <div className="bg-amber-950/30 border border-amber-500/20 rounded-3xl p-6 shadow-xl transition backdrop-blur-md relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Account Verification</span>
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Pending
                </span>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-stone-300 font-medium leading-relaxed">
                  Your profile details are saved! To send your application directly to our partner companies and unlock interviews, please complete your checkout.
                </p>
                <button 
                  onClick={() => router.push('/checkout')}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl shadow-lg transition text-xs animate-bounce"
                >
                  Verify Account & Pay Now
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="lg:col-span-8 space-y-6">
          
          {/* TAB 1: MY STATUS */}
          {activeTab === 'overview' && (
            <>
              <div className="bg-stone-950/85 backdrop-blur-md border border-stone-850/70 rounded-3xl p-8 relative overflow-hidden shadow-xl">
                <h1 className="text-xl font-bold text-white mb-2">
                  Where Your Application Stands
                </h1>
                <p className="text-stone-300 text-xs font-medium leading-relaxed max-w-xl">
                  Check how close you are to finishing the setup. Once your account is fully verified, we will match you directly with employers.
                </p>
              </div>

              <div className="bg-stone-950/85 backdrop-blur-md border border-stone-850/60 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Your Checklist</h3>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">Status: Active</span>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-stone-900/40 border border-stone-850/40 rounded-2xl gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-stone-950 rounded-xl flex items-center justify-center border border-stone-800">
                        <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Reviewing Your Profile</h4>
                        <p className="text-[10px] text-stone-400 font-medium">Selected Field: {activeInterests[0] || 'General'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                        Done
                      </span>
                      <div className="w-16 h-1 bg-stone-800 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-amber-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-stone-900/40 border border-stone-850/40 rounded-2xl gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-stone-950 rounded-xl flex items-center justify-center border border-stone-800">
                        <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">Sending to Recruiters</h4>
                        <p className="text-[10px] text-stone-400 font-medium">Sharing your profile with hiring partners</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                      {paymentStatus === 'unpaid' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">
                          Waiting on Payment
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                          Active
                        </span>
                      )}
                      <div className="w-16 h-1 bg-stone-800 rounded-full overflow-hidden">
                        <div className={`${paymentStatus === 'unpaid' ? 'w-1/4' : 'w-full'} h-full bg-amber-500 rounded-full`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {paymentStatus === 'paid' && (
                <div className="bg-stone-950/85 backdrop-blur-md border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center space-x-3">
                    <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-bold text-white">Upload Your Resume / CV File</h3>
                      <p className="text-[11px] text-stone-400">Select your CV document (PDF, DOCX) directly to submit it to hiring managers.</p>
                    </div>
                  </div>

                  <form onSubmit={handleCvUploadSubmit} className="space-y-4">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-stone-800 hover:border-amber-500/50 bg-stone-900/30 hover:bg-stone-900/60 transition rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <svg className="h-8 w-8 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-xs font-bold text-stone-200">
                        {selectedFile ? selectedFile.name : 'Click to select your CV document'}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, Word formats supported'}
                      </p>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    {cvRecord && (
                      <div className="flex items-center justify-between bg-stone-900/50 border border-stone-850 px-4 py-2.5 rounded-xl text-xs">
                        <div className="flex items-center gap-2 text-stone-300">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          <span>Active CV:</span>
                          <span className="font-semibold text-white max-w-[200px] truncate">{cvRecord.file_name}</span>
                        </div>
                        <a 
                          href={cvRecord.cv_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-amber-400 hover:text-amber-300 font-bold underline"
                        >
                          View Uploaded File
                        </a>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button 
                        type="submit" 
                        disabled={cvSubmitting || !selectedFile}
                        className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-extrabold rounded-xl text-xs transition w-full sm:w-auto"
                      >
                        {cvSubmitting ? 'Uploading File...' : 'Upload & Submit CV'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}

          {/* TAB 2: MY INTERVIEWS */}
          {activeTab === 'interviews' && (
            <div className="bg-stone-950/85 backdrop-blur-md border border-stone-850/60 rounded-3xl p-6 shadow-xl min-h-[300px] flex flex-col justify-center">
              {paymentStatus !== 'paid' ? (
                <div className="text-center max-w-md mx-auto space-y-4 py-8">
                  <div className="h-16 w-16 bg-stone-900/80 rounded-2xl flex items-center justify-center mx-auto border border-stone-800">
                    <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white">Verification Required</h3>
                  <p className="text-stone-400 text-xs leading-relaxed">
                    Interview schedules, meeting details, and company contacts are confidential. Secure your verified membership to instantly view and accept invitations.
                  </p>
                  <button 
                    onClick={() => router.push('/checkout')}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-xl transition"
                  >
                    Verify Account & Unlock
                  </button>
                </div>
              ) : (
                <div className="space-y-6 w-full h-full justify-start self-start">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-900 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">Your Job Matches</h3>
                      <p className="text-stone-400 text-xs">We automatically share your profile with partner agencies. Your upcoming interviews will appear below.</p>
                    </div>
                    <div className="flex items-center gap-2 self-start bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-xl">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-300">Matching Live</span>
                    </div>
                  </div>

                  {interviews.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-stone-800 rounded-2xl space-y-4 bg-stone-900/10">
                      <div className="h-10 w-10 border border-stone-800 bg-stone-950 rounded-full flex items-center justify-center mx-auto text-stone-500">
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-white">Looking for Matches</h4>
                        <p className="text-stone-400 text-[11px] max-w-xs mx-auto mt-1 leading-relaxed">
                          Your profile is active. Our system scans for new matching jobs hourly. Please check back soon.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {interviews.map((interview) => {
                        const isFullyScheduled = 
                          interview.company_name && 
                          interview.role_title && 
                          interview.interview_date && 
                          interview.notes;

                        if (!isFullyScheduled) {
                          return (
                            <div key={interview.id} className="p-5 bg-stone-900/20 border border-stone-850 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40"></div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                  <h4 className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">Match ID #{interview.id.substring(0, 5)}</h4>
                                </div>
                                <p className="text-xs font-bold text-white">Actively searching for interview</p>
                                <p className="text-[10px] text-stone-500 font-medium">We are currently matching your profile with open roles from our partner companies. Once an employer selects your application, your interview schedule will appear here.</p>
                              </div>
                              <span className="text-[9px] bg-stone-900 border border-stone-800 text-stone-400 px-2 py-1 rounded font-mono uppercase font-semibold">
                                Status: Searching
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div key={interview.id} className="p-5 bg-stone-900/40 border border-stone-850/70 rounded-2xl relative overflow-hidden flex flex-col gap-4">
                            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-extrabold text-white">{interview.company_name}</span>
                                  <span className="text-[9px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider border border-green-500/20">
                                    {interview.status || 'Scheduled'}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-amber-400">{interview.role_title}</p>
                              </div>
                              
                              {interview.meeting_link && (
                                <a 
                                  href={interview.meeting_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-4 py-2 bg-amber-500 text-stone-950 hover:bg-amber-400 text-xs font-bold rounded-xl transition shadow-sm w-full sm:w-auto text-center"
                                >
                                  Launch Video Call
                                </a>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-950/50 p-4 rounded-xl border border-stone-900">
                              <div>
                                <span className="block text-[9px] uppercase tracking-wider text-stone-500 font-bold mb-1">Interview Timeline</span>
                                <p className="text-xs font-medium text-stone-300 font-mono">
                                  {new Date(interview.interview_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                              </div>
                              <div>
                                <span className="block text-[9px] uppercase tracking-wider text-stone-500 font-bold mb-1">Coordinator Notes</span>
                                <p className="text-xs text-stone-300 leading-relaxed font-sans">{interview.notes}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY DETAILS */}
          {activeTab === 'settings' && (
            <div className="bg-stone-950/85 backdrop-blur-md border border-stone-850/60 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Your Saved Information</h3>
                <p className="text-stone-400 text-xs">This is the profile data we share with hiring managers to find your perfect job match.</p>
              </div>

              <div className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">My Full Name</label>
                    <input 
                      type="text" 
                      disabled 
                      value={fullName}
                      className="w-full bg-stone-900/60 border border-stone-800 rounded-xl px-4 py-3 text-stone-300 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">My Phone Number</label>
                    <input 
                      type="text" 
                      disabled 
                      value={phoneNumber}
                      className="w-full bg-stone-900/60 border border-stone-800 rounded-xl px-4 py-3 text-stone-300 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-900/80">
                  <span className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2">My Selected Industries</span>
                  <div className="flex flex-wrap gap-2">
                    {activeInterests.map((interest, index) => (
                      <span key={index} className="bg-stone-900 border border-stone-800 text-stone-300 px-3 py-1.5 rounded-xl font-bold text-[10px]">
                        {interest}
                      </span>
                    ))}
                  </div>
                  <span className="block text-[10px] text-stone-500 mt-2">We only match you with jobs in these chosen fields.</span>
                </div>
              </div>
            </div>
          )}

        </section>

      </main>

      <footer className="relative border-t border-stone-900/60 py-8 text-center text-xs text-stone-300 font-medium z-10 backdrop-blur-sm">
        <p>© 2026 Project Find. All rights reserved. Simplifying careers, one applicant at a time.</p>
      </footer>

      {/* ======================================================== */}
      {/* WHATSAPP-STYLE CHAT BUBBLE WIDGET                        */}
      {/* ======================================================== */}
      <div className="fixed bottom-6 right-6 z-50 font-sans text-stone-100 flex items-center space-x-3">
        {isCrmOpen ? (
          /* Expanded Chat Interface */
          <div className="w-80 md:w-96 h-[500px] flex flex-col bg-stone-950/95 border border-amber-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            
            {/* Chat Header */}
            <div className="bg-stone-900/90 border-b border-stone-800/60 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg border border-stone-900">
                  <svg className="h-4 w-4 text-stone-950" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white leading-none">Support Desk</h3>
                  <span className="text-[9px] text-green-400 font-medium flex items-center gap-1 mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Online
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsCrmOpen(false)}
                className="text-stone-400 hover:text-white transition p-1.5 rounded-lg hover:bg-stone-800/80"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-stone-950/40 relative custom-scrollbar">
              {crmLoadingHistory ? (
                <div className="flex justify-center items-center h-full">
                  <div className="h-5 w-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                </div>
              ) : crmHistory.length === 0 ? (
                <div className="text-center mt-10 space-y-2">
                  <p className="text-xs text-stone-500">No previous messages.</p>
                  <p className="text-[10px] text-stone-600">Send us a message and we'll reply here.</p>
                </div>
              ) : (
                crmHistory.map((msg, index) => {
                  // If the message came from this user profile, show it on the right side
                  const isUser = msg.profile_id === user.id;
                  
                  return (
                    <div key={msg.id || index} className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}>
                      <div 
                        className={`px-4 py-2.5 max-w-[85%] text-xs shadow-sm leading-relaxed ${
                          isUser 
                            ? 'bg-amber-500 text-stone-950 rounded-2xl rounded-tr-sm' 
                            : 'bg-stone-800 text-stone-200 border border-stone-700 rounded-2xl rounded-tl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                      
                      {/* Sub-label for status and timestamp */}
                      <div className={`flex items-center gap-2 mt-1 text-[9px] text-stone-500 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span>
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                        {isUser && (
                          <span className={`uppercase tracking-wider font-semibold opacity-70 ${msg.reply_status === 'replied' ? 'text-green-500' : ''}`}>
                            {msg.reply_status === 'replied' ? 'Answered' : 'Sent'}
                          </span>
                        )}
                      </div>

                      {/* Display the reply message directly underneath if the support desk replied */}
                      {msg.reply_status === 'replied' && msg.reply_message && (
                        <div className="mt-2 w-full flex flex-col items-start">
                           <div className="px-4 py-2.5 max-w-[85%] text-xs shadow-sm leading-relaxed bg-stone-800 text-stone-200 border border-stone-700 rounded-2xl rounded-tl-sm">
                              {msg.reply_message}
                           </div>
                           <span className="text-[9px] text-stone-500 mt-1">Support Desk Reply</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              {/* Invisible anchor to ensure scroll snaps to the bottom */}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Box */}
            <div className="p-3 bg-stone-900 border-t border-stone-800/80 shrink-0">
              <form onSubmit={handleCrmSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={crmMessage}
                  onChange={(e) => setCrmMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow bg-stone-950/80 border border-stone-700 rounded-full px-4 py-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/50 transition"
                />
                <button
                  type="submit"
                  disabled={crmSending || !crmMessage.trim()}
                  className="h-10 w-10 shrink-0 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 rounded-full flex items-center justify-center transition shadow-md"
                >
                  {crmSending ? (
                    <div className="h-4 w-4 border-2 border-stone-950/20 border-t-stone-950 rounded-full animate-spin"></div>
                  ) : (
                    <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </form>
            </div>

          </div>
        ) : (
          /* Floating Sticky Trigger Bubble Configuration */
          <div className="flex items-center gap-3 relative">
            <div className="hidden md:inline-flex bg-amber-500 text-stone-950 font-black tracking-tight text-[11px] px-3.5 py-2 rounded-xl shadow-lg border border-amber-400 animate-bounce duration-1000">
              Need Help? Ask Here!
            </div>
            <div className="absolute inset-0 w-14 h-14 -m-1 rounded-full bg-amber-500/30 animate-ping opacity-75 pointer-events-none"></div>
            <button
              onClick={() => setIsCrmOpen(true)}
              className="h-14 w-14 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(245,158,11,0.4)] border-2 border-stone-950 transition-all hover:scale-110 duration-200 group relative z-10"
              title="Open Chat"
            >
              <svg className="h-6 w-6 transform group-hover:rotate-12 transition duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        )}
      </div>

    </div>
  )
}