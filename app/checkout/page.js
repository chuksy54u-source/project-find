"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const getCleanSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

const supabaseUrl = getCleanSupabaseUrl()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function CheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState(null)
  
  // States
  const [copied, setCopied] = useState(false)
  const [screenshotFile, setScreenshotFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null) // State for image preview url
  const [senderName, setSenderName] = useState('')

  const accountNumber = "8178047999"

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }
      setUser(authUser)
      
      const { data: profile } = await supabase.from('profiles').select('payment_status').eq('id', authUser.id).single()
      if (profile?.payment_status === 'paid') router.push('/dashboard')
      setLoading(false)
    }
    checkSession()
  }, [router])

  // Clean up Object URL when component unmounts or file changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setScreenshotFile(file)
      
      // Generate preview URL
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleConfirmPayment = async (e) => {
    e.preventDefault()

    if (!senderName.trim()) {
      alert("Please enter the sender's account name.")
      return
    }
    if (!screenshotFile) {
      alert("Please upload a screenshot of your payment receipt.")
      return
    }

    setProcessing(true)

    try {
      // 1. Generate unique file path and upload receipt to Supabase Storage
      const fileExt = screenshotFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, screenshotFile)

      if (uploadError) throw uploadError

      // 2. Get the public URL of the receipt image
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath)

      // 3. Insert payment record into the 'payments' table
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          sender_name: senderName,
          amount: 3000,
          receipt_url: publicUrl,
          status: 'pending'
        })

      if (paymentError) throw paymentError

      // 4. Update core profile status to 'pending'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ payment_status: 'pending' })
        .eq('id', user.id)

      if (profileError) throw profileError

      router.push('/checkout/success')
    } catch (err) {
      console.error(err)
      alert("Something went wrong saving details. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans relative overflow-x-hidden flex flex-col items-center justify-center p-6">
      <div className="fixed inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1800&auto=format&fit=crop" className="w-full h-full object-cover brightness-60" />
        <div className="absolute inset-0 bg-stone-950/90" />
      </div>

      <div className="relative z-10 max-w-lg w-full bg-stone-900/50 backdrop-blur-xl border border-stone-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-white mb-2">Complete Verification</h1>
        <p className="text-stone-400 text-xs mb-6 font-medium">
          Please transfer <strong className="text-white font-bold">₦3,000</strong> to the account below, upload your receipt, and confirm.
        </p>

        {/* Bank Account Details Card */}
        <div className="bg-stone-950 p-6 rounded-2xl border border-amber-500/20 text-center space-y-1 mb-6">
          <span className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold">Bank Name</span>
          <p className="text-lg font-bold text-white">OPAY</p>
          
          <span className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold mt-3">Account Name</span>
          <p className="text-lg font-bold text-white">Igbozurike Kizito</p>
          
          <span className="block text-[10px] uppercase tracking-widest text-stone-500 font-bold mt-3">Account Number</span>
          <div className="flex items-center justify-center gap-3 mt-1">
            <p className="text-2xl font-black text-amber-500 tracking-widest">{accountNumber}</p>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold tracking-tight transition ${
                copied 
                ? "bg-amber-500 border-amber-500 text-stone-950" 
                : "bg-stone-900 border-stone-800 text-stone-300 hover:border-amber-500/50 hover:text-white"
              }`}
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleConfirmPayment} className="space-y-4 mb-6">
          {/* Sender Account Name Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-bold">
              Your Bank Account Name
            </label>
            <input 
              type="text" 
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. John Doe" 
              className="w-full bg-stone-950 border border-stone-850 rounded-xl px-4 py-3 text-stone-100 text-xs focus:outline-none focus:border-amber-500 transition font-medium"
            />
          </div>

          {/* Screenshot Upload Input with Image Preview */}
          <div className="space-y-1.5">
            <label className="block text-[10px] uppercase tracking-wider text-stone-400 font-bold">
              Upload Payment Receipt Screenshot
            </label>
            <div className="relative flex items-center justify-center w-full min-h-[160px] bg-stone-950 border border-dashed border-stone-800 rounded-xl p-4 hover:border-amber-500/50 transition cursor-pointer overflow-hidden">
              <input 
                type="file" 
                accept="image/*"
                required
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
              />
              
              {previewUrl ? (
                // Live preview layer
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-stone-950">
                  <img 
                    src={previewUrl} 
                    alt="Receipt preview" 
                    className="w-full h-full object-contain max-h-[140px] rounded-lg"
                  />
                  <div className="absolute bottom-2 bg-stone-900/90 border border-stone-800 text-[10px] text-stone-300 px-3 py-1 rounded-full font-medium">
                    Change Screenshot
                  </div>
                </div>
              ) : (
                // Default placeholder layer
                <div className="text-center z-10 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-stone-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-stone-400 font-medium select-none">
                    Click to select or drop screenshot
                  </p>
                  <p className="text-[10px] text-stone-600 mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button 
            type="submit"
            disabled={processing}
            className="w-full py-4 mt-2 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/5"
          >
            {processing ? 'Uploading Receipt...' : 'I have sent the payment'}
          </button>
        </form>
        
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full py-2 text-stone-500 text-xs font-bold hover:text-white transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}