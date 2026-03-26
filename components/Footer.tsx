import Link from 'next/link'
import { Trophy, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#060a0f] border-t border-white/5 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Trophy size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg">GolfGives</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              The platform where every golf score you submit is a chance to win — and a chance to give.
              Play with purpose.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Platform</h4>
            <ul className="space-y-2">
              {[
                { href: '/how-it-works', label: 'How It Works' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/charities', label: 'Charities' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Account</h4>
            <ul className="space-y-2">
              {[
                { href: '/signup', label: 'Sign Up' },
                { href: '/login', label: 'Sign In' },
                { href: '/dashboard', label: 'Dashboard' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            &copy; {new Date().getFullYear()} GolfGives. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs flex items-center gap-1">
            Made with <Heart size={12} className="text-emerald-500" /> for golfers who care
          </p>
        </div>
      </div>
    </footer>
  )
}
