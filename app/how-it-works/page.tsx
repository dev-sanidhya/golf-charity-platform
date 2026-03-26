import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Trophy, Heart, Target, Gift, ChevronRight, Check } from 'lucide-react'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Navbar />

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">The Platform</p>
            <h1 className="text-5xl font-extrabold mb-4">How GolfGives Works</h1>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              A subscription golf platform built around three things: your game, meaningful prizes, and charitable giving.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6 mb-16">
            {[
              {
                icon: <Trophy size={28} className="text-emerald-400" />,
                step: 1,
                title: 'Subscribe to GolfGives',
                desc: 'Choose a monthly (£19.99/mo) or yearly (£179.99/yr) plan. Your subscription funds the monthly prize pool and supports a charity you choose.',
                sub: 'Part of every subscription goes to prizes, part to charity — automatically.',
              },
              {
                icon: <Heart size={28} className="text-emerald-400" />,
                step: 2,
                title: 'Choose Your Charity',
                desc: 'Select from our directory of vetted UK charities. A minimum of 10% of your subscription is donated on your behalf every month. You can increase this to up to 50%.',
                sub: 'You can change your charity selection anytime from your dashboard.',
              },
              {
                icon: <Target size={28} className="text-emerald-400" />,
                step: 3,
                title: 'Submit Your Stableford Scores',
                desc: 'Log up to 5 Stableford golf scores (range: 1–45), each with a date. Only your most recent 5 scores are stored — new scores automatically replace older ones.',
                sub: 'Having 5 valid scores automatically enters you in the next monthly draw.',
              },
              {
                icon: <Gift size={28} className="text-emerald-400" />,
                step: 4,
                title: 'The Monthly Draw',
                desc: 'On the last day of each month, 5 draw numbers are generated (random or algorithmic). Your scores are compared to these numbers.',
                sub: 'Match 3 numbers = prize. Match 4 = bigger prize. Match all 5 = JACKPOT.',
              },
            ].map((item) => (
              <div key={item.step} className="card-dark p-7 flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mb-1">Step {item.step}</div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-slate-300 leading-relaxed mb-2">{item.desc}</p>
                  <p className="text-slate-500 text-sm">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Prize pool breakdown */}
          <div className="card-dark p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6">Prize Pool Breakdown</h2>
            <p className="text-slate-400 mb-6">30% of all subscriptions contribute to the monthly prize pool. It is split as follows:</p>
            <div className="space-y-3 mb-6">
              {[
                { match: '5-Number Match (Jackpot)', share: '40%', rollover: 'Rolls over if unclaimed', color: 'from-yellow-500 to-amber-500' },
                { match: '4-Number Match', share: '35%', rollover: 'Distributed monthly', color: 'from-emerald-500 to-teal-500' },
                { match: '3-Number Match', share: '25%', rollover: 'Distributed monthly', color: 'from-blue-500 to-cyan-500' },
              ].map((tier) => (
                <div key={tier.match} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {tier.share}
                    </div>
                    <div>
                      <div className="font-medium">{tier.match}</div>
                      <div className="text-xs text-slate-500">{tier.rollover}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Check size={14} className="text-emerald-400" />
                If multiple users match the same tier, the prize is split equally among them.
              </div>
            </div>
          </div>

          {/* Winner verification */}
          <div className="card-dark p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">Winner Verification</h2>
            <p className="text-slate-400 mb-5 leading-relaxed">
              To ensure fair play, all prize winners must complete a simple verification process before payment is released.
            </p>
            <div className="space-y-3">
              {[
                'You are notified when you match 3 or more draw numbers',
                'Upload a screenshot from your golf platform showing your scores',
                'Our team reviews and approves within 48 hours',
                'Payment is processed once verified',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-xs text-emerald-400 font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-slate-300 text-sm">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
            <p className="text-slate-400 mb-8">Join GolfGives and start making every round count.</p>
            <Link href="/signup" className="btn-primary text-lg py-4 px-10 inline-block">
              Get Started <ChevronRight size={20} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
