'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Check, Trophy, Loader2 } from 'lucide-react'

function PricingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selected, setSelected] = useState<'monthly' | 'yearly'>(
    (searchParams.get('plan') as 'monthly' | 'yearly') || 'monthly'
  )
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selected }),
      })
      const { url, error } = await res.json()
      if (error) {
        if (error === 'Not authenticated') {
          router.push(`/signup?plan=${selected}`)
          return
        }
        throw new Error(error)
      }
      if (url) window.location.href = url
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'Monthly Stableford draw entry',
    'Unlimited score submissions (rolling 5)',
    'Charity contribution of your choice',
    'Full winner verification',
    'Draw result notifications',
    'Mobile-friendly dashboard',
  ]

  const plans = [
    {
      id: 'monthly' as const,
      name: 'Monthly',
      price: '£19.99',
      period: '/month',
      desc: 'Perfect for getting started',
      badge: null,
    },
    {
      id: 'yearly' as const,
      name: 'Yearly',
      price: '£179.99',
      period: '/year',
      desc: 'Best value — save over 25%',
      badge: 'Save 25%',
    },
  ]

  return (
    <div className="pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Simple Pricing</p>
          <h1 className="text-5xl font-extrabold mb-4">Choose Your Plan</h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            One subscription. Monthly draws. Charity contribution. Cancel anytime.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`card-dark p-8 text-left relative transition-all ${
                selected === plan.id ? 'border-emerald-500/60 bg-emerald-500/5' : 'hover:border-slate-600'
              }`}
            >
              {plan.badge && (
                <span className="absolute top-4 right-4 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                  {plan.badge}
                </span>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected === plan.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
                }`}>
                  {selected === plan.id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-lg font-bold">{plan.name}</span>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm">{plan.period}</span>
              </div>
              <p className="text-slate-400 text-sm">{plan.desc}</p>
            </button>
          ))}
        </div>

        {/* Features included */}
        <div className="card-dark p-8 mb-8">
          <h3 className="font-semibold mb-5 text-center text-slate-300">Everything included in both plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-emerald-400" />
                </div>
                <span className="text-sm text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscribe button */}
        <div className="text-center">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn-primary text-lg py-4 px-12 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Trophy size={20} />}
            {loading ? 'Redirecting...' : `Subscribe ${selected === 'monthly' ? '£19.99/mo' : '£179.99/yr'}`}
          </button>
          <p className="text-xs text-slate-500 mt-4">
            Secure payment via Stripe. Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Navbar />
      <Suspense fallback={<div className="pt-32 text-center text-slate-400">Loading...</div>}>
        <PricingContent />
      </Suspense>
      <Footer />
    </div>
  )
}
