"use client"

import dynamic from 'next/dynamic'

// Dynamically import the client component and explicitly disable SSR
const CheckoutClient = dynamic(() => import('./CheckoutClient'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center text-amber-500 font-bold">
      Loading Checkout...
    </div>
  )
})

export default function CheckoutPage() {
  return <CheckoutClient />
}