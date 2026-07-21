"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

// Clean up environment variables safely to prevent trailing slash errors
const getCleanSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

// Initialize the Supabase Client
const supabaseUrl = getCleanSupabaseUrl()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function CrmDashboard() {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'unreplied', 'replied'
  const [activeTab, setActiveTab] = useState('all-types') // 'all-types', 'GM', 'CM'
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const chatEndRef = useRef(null)

  // Fetch all support pipeline tickets safely
  const fetchMessages = async () => {
    setLoading(true)
    try {
      // 1. Fetch CRM table directly first to guarantee all messages load
      const { data, error } = await supabase
        .from('crm')
        .select(`
          id,
          created_at,
          name,
          email,
          message,
          status,
          reply_status,
          reply_message,
          message_type,
          profile_id
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 2. Gather unique, non-null profile IDs
      const profileIds = (data || [])
        .map(msg => msg.profile_id)
        .filter(id => id !== null && id !== undefined)

      let profilesMap = {}

      // 3. Query linked profiles separately to prevent empty/unauthenticated RLS blockages
      if (profileIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone_number, interests')
          .in('id', profileIds)

        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile
            return acc
          }, {})
        } else {
          console.warn("Profiles fetch bypassed or restricted by RLS configurations:", profilesError)
        }
      }

      // 4. Merge profile records back into client state
      const mergedData = (data || []).map(msg => ({
        ...msg,
        profiles: msg.profile_id ? profilesMap[msg.profile_id] : null
      }))

      setMessages(mergedData)
    } catch (err) {
      console.error('Error fetching CRM messages:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auth protection check to ensure only support representatives can access
    const checkCrmAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_crm')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.is_crm) {
        router.push('/dashboard')
      }
    }

    checkCrmAccess()
    fetchMessages()
  }, [router])

  // Process tickets to format ID tags based on exact DB message types
  const processedMessages = messages.map(msg => {
    const typeUpper = (msg.message_type || 'gm').toUpperCase()
    return {
      ...msg,
      ticketId: `${typeUpper}-${msg.id.slice(0, 5).toUpperCase()}`,
      type: typeUpper
    }
  })

  // Filter pipeline messages based on tab view, category, and matching search queries
  const filteredMessages = processedMessages.filter(msg => {
    const matchesStatus =
      filter === 'all' ? true :
      filter === 'unreplied' ? msg.reply_status === 'unreplied' :
      msg.reply_status === 'replied'

    const matchesType =
      activeTab === 'all-types' ? true :
      activeTab === 'GM' ? msg.type === 'GM' :
      msg.type === 'CM'

    const matchesSearch =
      msg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.ticketId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesType && matchesSearch
  })

  // Gather full chat thread history if selected message is CM
  const customerThread = selectedMessage && selectedMessage.type === 'CM' && selectedMessage.profile_id
    ? messages
        .filter(m => m.profile_id === selectedMessage.profile_id)
        .map(msg => {
          const typeUpper = (msg.message_type || 'gm').toUpperCase()
          return {
            ...msg,
            ticketId: `${typeUpper}-${msg.id.slice(0, 5).toUpperCase()}`,
            type: typeUpper
          }
        })
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    : []

  // Auto scroll chat to bottom when thread updates
  useEffect(() => {
    if (selectedMessage?.type === 'CM') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [customerThread, selectedMessage])

  // Submit response updates
  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedMessage) return
    setSubmittingReply(true)

    try {
      const updateData = {
        reply_status: 'replied'
      }

      // Customer messages write the reply_message so they can view it in their dashboard
      if (selectedMessage.type === 'CM') {
        updateData.reply_message = replyText
      }

      const { error } = await supabase
        .from('crm')
        .update(updateData)
        .eq('id', selectedMessage.id)

      if (error) throw error

      // Refresh local state list
      setMessages(prev =>
        prev.map(m => m.id === selectedMessage.id
          ? { ...m, ...updateData }
          : m
        )
      )
      
      setSelectedMessage(prev => ({ ...prev, ...updateData }))
      setReplyText('')
    } catch (err) {
      alert(`Error updating ticket: ${err.message}`)
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-600 selection:text-white flex flex-col">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 w-full h-full z-0 bg-stone-950 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-950 to-stone-950 z-1"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] z-1"></div>
      </div>

      {/* CRM NAV HEADER */}
      <header className="relative max-w-7xl mx-auto w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-900/60 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/crm')}>
          <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center border border-stone-800 shadow-lg overflow-hidden shrink-0 relative">
            <span className="text-[10px] font-bold text-white tracking-tighter lowercase font-sans absolute">project</span>
          </div>
          <span className="text-lg font-extrabold bg-gradient-to-r from-white to-stone-400 bg-clip-text text-transparent tracking-tight">
            Project Find CRM
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Customer Support Workspace
          </span>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-stone-900/90 hover:bg-stone-850 text-stone-300 text-xs font-semibold rounded-xl border border-stone-850 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <main className="relative flex-grow max-w-7xl mx-auto w-full px-6 py-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Hand Listing Area (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-stone-900/40 border border-stone-900 p-4 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              
              {/* Type Category Tabs */}
              <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-900 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('all-types')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'all-types' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-white'}`}
                >
                  All Mail
                </button>
                <button
                  onClick={() => setActiveTab('GM')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'GM' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-white'}`}
                >
                  General (GM)
                </button>
                <button
                  onClick={() => setActiveTab('CM')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'CM' ? 'bg-amber-600 text-stone-950' : 'text-stone-400 hover:text-white'}`}
                >
                  Customers (CM)
                </button>
              </div>

              {/* Reply Status Filters */}
              <div className="flex gap-2 w-full sm:w-auto">
                {['all', 'unreplied', 'replied'].map((statusOption) => (
                  <button
                    key={statusOption}
                    onClick={() => setFilter(statusOption)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all ${
                      filter === statusOption
                        ? 'bg-stone-800 text-amber-400 border-amber-500/30'
                        : 'border-stone-900 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {statusOption}
                  </button>
                ))}
              </div>

            </div>

            {/* Search input */}
            <input
              type="text"
              placeholder="Search by sender name, email, query, or ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-850 rounded-xl px-4 py-3 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
            />
          </div>

          {/* Ticket Messages List */}
          <div className="flex-grow max-h-[550px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {loading ? (
              <div className="text-center py-12 text-sm text-stone-400 animate-pulse">
                Syncing ticket pipeline databases...
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="bg-stone-900/20 border border-stone-900/60 rounded-2xl p-12 text-center text-stone-400 text-sm font-medium">
                No active matching requests in support queue.
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg)
                    setReplyText(msg.reply_message || '')
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                    selectedMessage?.id === msg.id
                      ? 'bg-amber-500/5 border-amber-500/40 shadow-lg'
                      : 'bg-stone-900/30 border-stone-900/80 hover:bg-stone-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="font-extrabold text-stone-100 text-sm block">
                        {msg.profiles?.full_name || msg.name || 'Anonymous User'}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        {msg.profiles?.email || msg.email || 'No email provided'}
                      </span>
                    </div>
                   
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-mono tracking-wider font-bold bg-stone-950 border border-stone-850 px-2 py-0.5 rounded text-stone-300">
                        {msg.ticketId}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        msg.reply_status === 'replied'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {msg.reply_status}
                      </span>
                    </div>
                  </div>

                  <p className="text-stone-300 text-xs line-clamp-2 mt-2 leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Hand Interaction / Reply Panel (5 Columns) */}
        <div className="lg:col-span-5">
          <div className="bg-stone-900/30 border border-stone-900/80 rounded-3xl p-6 lg:p-8 flex flex-col justify-between h-full sticky top-8 min-h-[550px]">
            {selectedMessage ? (
              <div className="flex flex-col h-full justify-between space-y-6">
                
                {/* --- CHAT FORMAT FOR CM MESSAGES --- */}
                {selectedMessage.type === 'CM' ? (
                  <div className="flex flex-col h-[460px] justify-between space-y-4">
                    {/* Header info */}
                    <div className="border-b border-stone-900 pb-3 flex items-center justify-between shrink-0">
                      <div>
                        <span className="text-xs font-mono font-bold text-amber-500">{selectedMessage.ticketId}</span>
                        <h3 className="text-base font-black text-white mt-0.5">
                          {selectedMessage.profiles?.full_name || selectedMessage.name || 'Anonymous User'}
                        </h3>
                        <p className="text-[11px] text-stone-400 font-medium">
                          {selectedMessage.profiles?.email || selectedMessage.email}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Live Chat Thread
                      </span>
                    </div>

                    {/* Chat Messages Scroll Area */}
                    <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar bg-stone-950/40 p-3 rounded-2xl border border-stone-900/80">
                      {customerThread.length === 0 ? (
                        <div className="text-center py-12 text-stone-500 text-xs">No chat history available.</div>
                      ) : (
                        customerThread.map((msgItem) => {
                          const isCurrentSelected = msgItem.id === selectedMessage.id;
                          return (
                            <div key={msgItem.id} className="space-y-3">
                              {/* Customer Message Bubble */}
                              <div className="flex flex-col items-start w-full">
                                <div 
                                  onClick={() => {
                                    setSelectedMessage(msgItem)
                                    setReplyText(msgItem.reply_message || '')
                                  }}
                                  className={`px-4 py-3 max-w-[90%] text-xs shadow-sm leading-relaxed rounded-2xl rounded-tl-sm cursor-pointer border transition ${
                                    isCurrentSelected 
                                      ? 'bg-stone-850 text-stone-100 border-amber-500/40 ring-1 ring-amber-500/30' 
                                      : 'bg-stone-900 text-stone-200 border-stone-800 hover:bg-stone-850'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-4 mb-1">
                                    <span className="text-[9px] font-mono font-bold text-amber-400">{msgItem.ticketId}</span>
                                    <span className="text-[9px] text-stone-400">
                                      {new Date(msgItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  {msgItem.message}
                                </div>
                              </div>

                              {/* Support Reply Bubble (if replied) */}
                              {msgItem.reply_status === 'replied' && msgItem.reply_message && (
                                <div className="flex flex-col items-end w-full">
                                  <div className="px-4 py-3 max-w-[90%] text-xs shadow-sm leading-relaxed bg-amber-500 text-stone-950 rounded-2xl rounded-tr-sm font-medium">
                                    <div className="flex items-center justify-between gap-4 mb-1 opacity-75">
                                      <span className="text-[9px] font-mono font-bold uppercase">Support Response</span>
                                      <span className="text-[9px]">Answered</span>
                                    </div>
                                    {msgItem.reply_message}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Reply Form */}
                    <form onSubmit={handleSendReply} className="space-y-3 pt-2 shrink-0">
                      <div className="relative">
                        <textarea
                          required
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          disabled={selectedMessage.reply_status === 'replied'}
                          placeholder="Type response for this customer ticket..."
                          className="w-full bg-stone-950 border border-stone-900 rounded-xl px-4 py-3 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition font-medium disabled:opacity-50 resize-none"
                        />
                      </div>

                      {selectedMessage.reply_status === 'replied' ? (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold p-2.5 rounded-xl text-center">
                          This inquiry has already been resolved and replied.
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={submittingReply}
                          className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-stone-900 disabled:text-stone-500 text-stone-950 font-black rounded-xl text-xs transition active:scale-95 text-center shadow-lg"
                        >
                          {submittingReply ? 'Sending Response...' : 'Send Chat Reply'}
                        </button>
                      )}
                    </form>
                  </div>
                ) : (
                  /* --- STANDARD TICKET FORMAT FOR GM MESSAGES --- */
                  <div className="flex flex-col h-full justify-between space-y-6">
                    <div>
                      <div className="flex items-center justify-between border-b border-stone-900 pb-4 mb-4">
                        <div>
                          <span className="text-xs font-mono font-bold text-amber-500">{selectedMessage.ticketId}</span>
                          <h3 className="text-lg font-black text-white mt-1">
                            {selectedMessage.profiles?.full_name || selectedMessage.name || 'Anonymous User'}
                          </h3>
                          <p className="text-xs text-stone-400 font-medium">
                            {selectedMessage.profiles?.email || selectedMessage.email}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Inquiry Description</span>
                          <div className="bg-stone-950/60 border border-stone-900 rounded-xl p-4 text-xs text-stone-200 leading-relaxed max-h-[150px] overflow-y-auto">
                            {selectedMessage.message}
                          </div>
                        </div>

                        <div className="p-3 bg-stone-950/40 border border-stone-900 rounded-xl text-stone-400 text-[11px] leading-relaxed">
                          This is a General Message (GM). Sending a reply updates the status to Replied, but does not route a response payload back to a user profile account.
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSendReply} className="space-y-4 pt-4 border-t border-stone-900">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                          Notes / Status Summary
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          disabled={selectedMessage.reply_status === 'replied'}
                          placeholder="Update status notes regarding general query action items..."
                          className="w-full bg-stone-950 border border-stone-900 rounded-xl px-4 py-3 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition font-medium disabled:opacity-50"
                        />
                      </div>

                      {selectedMessage.reply_status === 'replied' ? (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold p-3 rounded-xl text-center">
                          This inquiry has already been resolved and replied.
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={submittingReply}
                          className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-stone-900 disabled:text-stone-500 text-stone-950 font-black rounded-xl text-xs transition active:scale-95 text-center shadow-lg"
                        >
                          {submittingReply ? 'Sending Response...' : 'Submit Resolution'}
                        </button>
                      )}
                    </form>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center my-auto space-y-3">
                <span className="text-3xl">✉️</span>
                <h4 className="text-md font-bold text-stone-200">No Ticket Selected</h4>
                <p className="text-stone-400 text-xs max-w-xs leading-relaxed">
                  Select a message from the queue on the left to see full details, resolve issues, and draft replies.
                </p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative border-t border-stone-900/60 py-6 text-center text-xs text-stone-400 font-medium z-10 backdrop-blur-sm">
        <p>© 2026 Project Find. Support Portal. All actions are securely logged under staff authentication.</p>
      </footer>

    </div>
  )
}