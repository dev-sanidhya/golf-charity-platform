'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<{ email: string; role?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('email, role')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) setUser(profile)
          })
      }
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e14]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white">GolfGives</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/charities" className="text-slate-300 hover:text-white text-sm transition-colors">
              Charities
            </Link>
            <Link href="/how-it-works" className="text-slate-300 hover:text-white text-sm transition-colors">
              How It Works
            </Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white text-sm transition-colors">
              Pricing
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="text-slate-300 hover:text-white text-sm transition-colors"
                >
                  {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </Link>
                <button onClick={handleSignOut} className="btn-outline text-sm py-2 px-4">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-slate-300 hover:text-white text-sm transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary text-sm py-2 px-5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-[#0d1117] border-b border-white/5 px-4 py-4 flex flex-col gap-4">
          <Link href="/charities" className="text-slate-300 hover:text-white text-sm" onClick={() => setOpen(false)}>Charities</Link>
          <Link href="/how-it-works" className="text-slate-300 hover:text-white text-sm" onClick={() => setOpen(false)}>How It Works</Link>
          <Link href="/pricing" className="text-slate-300 hover:text-white text-sm" onClick={() => setOpen(false)}>Pricing</Link>
          {user ? (
            <>
              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="text-emerald-400 font-medium text-sm" onClick={() => setOpen(false)}>
                {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
              </Link>
              <button onClick={handleSignOut} className="text-left text-slate-400 text-sm">Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-300 text-sm" onClick={() => setOpen(false)}>Sign In</Link>
              <Link href="/signup" className="btn-primary text-sm text-center" onClick={() => setOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
