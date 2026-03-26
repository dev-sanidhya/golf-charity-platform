import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Trophy, Heart, Star, TrendingUp, Shield, ChevronRight, Users, Target, Gift } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-2xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-400 text-sm font-medium mb-8">
            <Heart size={14} />
            <span>Every score supports a charity</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6">
            Play Golf.{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Win Prizes.
            </span>
            <br />
            Change Lives.
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Submit your Stableford scores each month, enter our prize draw, and automatically
            support a charity you believe in — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary text-lg py-4 px-8 w-full sm:w-auto text-center inline-block">
              Start Your Journey <ChevronRight size={20} className="inline ml-1" />
            </Link>
            <Link href="/how-it-works" className="btn-outline text-lg py-4 px-8 w-full sm:w-auto text-center inline-block">
              How It Works
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl mx-auto">
            {[
              { value: '£50K+', label: 'Prize Pool' },
              { value: '12+', label: 'Charities' },
              { value: '2K+', label: 'Members' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-4xl font-bold">How GolfGives Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Trophy size={28} className="text-emerald-400" />,
                step: '01',
                title: 'Subscribe & Choose',
                desc: 'Pick a monthly or yearly plan. Select a charity to receive part of your subscription — giving starts on day one.',
              },
              {
                icon: <Target size={28} className="text-emerald-400" />,
                step: '02',
                title: 'Log Your Scores',
                desc: 'Submit your last 5 Stableford scores (1–45). Your rolling score card automatically enters you into the monthly draw.',
              },
              {
                icon: <Gift size={28} className="text-emerald-400" />,
                step: '03',
                title: 'Win & Give Back',
                desc: 'Five draw numbers are published each month. Match 3, 4, or all 5 to win from the prize pool. Every round counts.',
              },
            ].map((item) => (
              <div key={item.step} className="card-dark p-8 relative overflow-hidden hover:border-emerald-500/30 transition-colors">
                <div className="absolute top-6 right-6 text-6xl font-black text-white/3 select-none">{item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Pool */}
      <section className="py-20 px-4 bg-slate-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Monthly Draw</p>
              <h2 className="text-4xl font-bold mb-6">Three Ways to Win</h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                A portion of every subscription flows into the monthly prize pool. Match your
                scores against the draw numbers for a chance to win your share.
              </p>
              <Link href="/signup" className="btn-primary inline-block">Join the Draw</Link>
            </div>

            <div className="space-y-4">
              {[
                { match: '5-Number Match', pool: '40%', label: 'JACKPOT', rollover: true, color: 'from-yellow-500 to-amber-500' },
                { match: '4-Number Match', pool: '35%', label: 'PRIZE', rollover: false, color: 'from-emerald-500 to-teal-500' },
                { match: '3-Number Match', pool: '25%', label: 'REWARD', rollover: false, color: 'from-blue-500 to-cyan-500' },
              ].map((tier) => (
                <div key={tier.match} className="card-dark p-5 flex items-center justify-between hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {tier.pool}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{tier.match}</div>
                      <div className="text-xs text-slate-500">{tier.rollover ? 'Rolls over if unclaimed' : 'Paid out monthly'}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>{tier.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Charities */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Giving Back</p>
            <h2 className="text-4xl font-bold mb-4">Choose Your Cause</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              At least 10% of your subscription goes directly to a charity of your choice. You can increase that percentage anytime.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {['Cancer Research UK','Age UK','RNLI','Macmillan Cancer Support','British Heart Foundation','Shelter'].map((charity) => (
              <div key={charity} className="card-dark p-4 text-center hover:border-emerald-500/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <Heart size={18} className="text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-white">{charity}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/charities" className="btn-outline inline-block">View All Charities</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-slate-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold">Why GolfGives?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield size={24} className="text-emerald-400" />, title: 'Secure Payments', desc: 'Stripe-powered, fully PCI compliant.' },
              { icon: <Star size={24} className="text-emerald-400" />, title: 'Fair Draws', desc: 'Transparent random and algorithmic engines.' },
              { icon: <TrendingUp size={24} className="text-emerald-400" />, title: 'Track Progress', desc: 'Monitor scores, draws, and charity impact.' },
              { icon: <Users size={24} className="text-emerald-400" />, title: 'Community', desc: 'Join thousands making a difference.' },
            ].map((item) => (
              <div key={item.title} className="card-dark p-6 text-center hover:border-emerald-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/60 to-teal-900/40 border border-emerald-500/20 p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Play with Purpose?</h2>
            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
              Start your subscription today. Submit your scores. Change lives.
            </p>
            <Link href="/signup" className="btn-primary text-lg py-4 px-10 inline-block">
              Get Started Free <ChevronRight size={20} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
