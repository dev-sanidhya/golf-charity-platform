'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Trophy, Heart, Calendar, TrendingUp, Plus, Edit2, Trash2,
  Loader2, CheckCircle, AlertCircle, Upload, ChevronRight, LogOut
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Profile, Score, Charity, Draw, DrawResult } from '@/types/database'

type Tab = 'overview' | 'scores' | 'draws' | 'charity'

export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [scores, setScores] = useState<Score[]>([])
  const [charity, setCharity] = useState<Charity | null>(null)
  const [latestDraw, setLatestDraw] = useState<Draw | null>(null)
  const [myResults, setMyResults] = useState<DrawResult[]>([])
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)

  // Score form
  const [newScore, setNewScore] = useState('')
  const [newDate, setNewDate] = useState('')
  const [scoreLoading, setScoredLoading] = useState(false)
  const [scoreMsg, setScoreMsg] = useState('')

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [
      { data: prof },
      { data: scr },
      { data: draws },
      { data: results },
      { data: allCharities },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(5),
      supabase.from('draws').select('*').eq('status', 'published').order('year', { ascending: false }).order('month', { ascending: false }).limit(1),
      supabase.from('draw_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('charities').select('*').eq('is_active', true),
    ])

    setProfile(prof)
    setScores(scr || [])
    setMyResults(results || [])
    setCharities(allCharities || [])

    if (draws && draws.length > 0) setLatestDraw(draws[0])

    if (prof?.charity_id) {
      const { data: ch } = await supabase.from('charities').select('*').eq('id', prof.charity_id).single()
      setCharity(ch)
    }

    setLoading(false)
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  const addScore = async () => {
    if (!newScore || !newDate) return
    const val = parseInt(newScore)
    if (val < 1 || val > 45) { setScoreMsg('Score must be between 1 and 45'); return }

    setScoredLoading(true)
    setScoreMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Rolling 5: if already 5 scores, delete oldest
    if (scores.length >= 5) {
      const oldest = [...scores].sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())[0]
      await supabase.from('scores').delete().eq('id', oldest.id)
    }

    const { error } = await supabase.from('scores').insert({ user_id: user.id, score: val, played_at: newDate })
    if (error) {
      setScoreMsg('Failed to add score')
    } else {
      setScoreMsg('Score added!')
      setNewScore('')
      setNewDate('')
      fetchData()
    }
    setScoredLoading(false)
  }

  const deleteScore = async (id: string) => {
    await supabase.from('scores').delete().eq('id', id)
    fetchData()
  }

  const updateCharity = async (charityId: string, pct: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ charity_id: charityId, charity_percentage: pct }).eq('id', user.id)
    fetchData()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    )
  }

  const subStatus = profile?.subscription_status || 'inactive'
  const isActive = subStatus === 'active'

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      {/* Sidebar */}
      <div className="flex">
        <aside className="hidden lg:flex flex-col w-64 fixed h-screen bg-slate-900/80 border-r border-slate-700/50 p-6">
          <Link href="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">GolfGives</span>
          </Link>

          <nav className="flex flex-col gap-1 flex-1">
            {([
              { id: 'overview', label: 'Overview', icon: <TrendingUp size={18} /> },
              { id: 'scores', label: 'My Scores', icon: <Edit2 size={18} /> },
              { id: 'draws', label: 'Draws & Wins', icon: <Trophy size={18} /> },
              { id: 'charity', label: 'My Charity', icon: <Heart size={18} /> },
            ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === item.id
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:text-white text-sm transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-8 pt-6">
          {/* Mobile nav */}
          <div className="flex lg:hidden items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Trophy size={14} className="text-white" />
              </div>
              <span className="font-bold text-white">GolfGives</span>
            </Link>
            <button onClick={handleSignOut} className="text-slate-400 hover:text-white">
              <LogOut size={20} />
            </button>
          </div>

          {/* Mobile tab bar */}
          <div className="flex lg:hidden gap-1 mb-6 bg-slate-900/50 rounded-xl p-1 border border-slate-700/50">
            {([
              { id: 'overview', label: 'Overview' },
              { id: 'scores', label: 'Scores' },
              { id: 'draws', label: 'Draws' },
              { id: 'charity', label: 'Charity' },
            ] as { id: Tab; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                  tab === t.id ? 'bg-emerald-500 text-white' : 'text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'Golfer'}!</h1>
                <p className="text-slate-400 text-sm mt-1">Here&apos;s your performance snapshot</p>
              </div>

              {/* Status cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {/* Subscription */}
                <div className="card-dark p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-sm">Subscription</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {subStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xl font-bold capitalize">{profile?.subscription_plan || 'None'}</div>
                  {profile?.subscription_end_date && (
                    <div className="text-xs text-slate-500 mt-1">
                      Renews {formatDate(profile.subscription_end_date)}
                    </div>
                  )}
                  {!isActive && (
                    <Link href="/pricing" className="mt-3 text-xs text-emerald-400 flex items-center gap-1">
                      Subscribe now <ChevronRight size={12} />
                    </Link>
                  )}
                </div>

                {/* Scores */}
                <div className="card-dark p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-sm">Scores Submitted</span>
                    <Edit2 size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold">{scores.length}<span className="text-slate-500 text-lg">/5</span></div>
                  <div className="text-xs text-slate-500 mt-1">
                    {scores.length === 5 ? 'Entered in next draw' : `${5 - scores.length} more to qualify`}
                  </div>
                </div>

                {/* Charity */}
                <div className="card-dark p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-sm">Charity Support</span>
                    <Heart size={16} className="text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold">{charity?.name || 'None selected'}</div>
                  <div className="text-xs text-slate-500 mt-1">{profile?.charity_percentage || 10}% of subscription</div>
                </div>
              </div>

              {/* Latest draw + recent scores */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Latest draw */}
                <div className="card-dark p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Trophy size={18} className="text-emerald-400" />
                    Latest Draw
                  </h3>
                  {latestDraw ? (
                    <div>
                      <p className="text-slate-400 text-sm mb-4">
                        {new Date(latestDraw.year, latestDraw.month - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {latestDraw.draw_numbers.map((n, i) => (
                          <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No published draw yet</p>
                  )}
                </div>

                {/* Recent scores */}
                <div className="card-dark p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-emerald-400" />
                    Recent Scores
                  </h3>
                  {scores.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-slate-500 text-sm mb-3">No scores yet</p>
                      <button onClick={() => setTab('scores')} className="btn-primary text-sm py-2 px-4">
                        Add First Score
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scores.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                          <span className="text-sm text-slate-300">{formatDate(s.played_at)}</span>
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                            {s.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Winnings */}
              {myResults.length > 0 && (
                <div className="card-dark p-6 mt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-400" />
                    My Winnings
                  </h3>
                  <div className="space-y-3">
                    {myResults.filter((r) => r.prize_amount > 0).map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div>
                          <div className="text-sm font-medium">{r.match_count}-Number Match</div>
                          <div className="text-xs text-slate-500">{formatDate(r.created_at)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400">{formatCurrency(r.prize_amount)}</div>
                          <div className={`text-xs ${r.payment_status === 'paid' ? 'text-emerald-400' : r.payment_status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {r.payment_status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SCORES ── */}
          {tab === 'scores' && (
            <div>
              <h1 className="text-2xl font-bold mb-2">My Golf Scores</h1>
              <p className="text-slate-400 text-sm mb-8">Enter your Stableford scores (1–45). Only the latest 5 are kept.</p>

              {/* Add score form */}
              {isActive && (
                <div className="card-dark p-6 mb-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-emerald-400" />
                    Add New Score
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="label-dark">Score (1–45)</label>
                      <input
                        type="number"
                        min={1}
                        max={45}
                        value={newScore}
                        onChange={(e) => setNewScore(e.target.value)}
                        placeholder="e.g. 32"
                        className="input-dark"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="label-dark">Date Played</label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="input-dark"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addScore}
                        disabled={scoreLoading}
                        className="btn-primary py-3 px-6 flex items-center gap-2 whitespace-nowrap"
                      >
                        {scoreLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        Add Score
                      </button>
                    </div>
                  </div>
                  {scoreMsg && (
                    <div className={`mt-3 flex items-center gap-2 text-sm ${scoreMsg.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>
                      {scoreMsg.includes('Failed') ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                      {scoreMsg}
                    </div>
                  )}
                </div>
              )}

              {!isActive && (
                <div className="card-dark p-6 mb-6 border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="text-yellow-400" />
                    <div>
                      <div className="font-medium text-yellow-400">Subscription Required</div>
                      <div className="text-sm text-slate-400">Subscribe to enter scores and participate in draws.</div>
                    </div>
                    <Link href="/pricing" className="ml-auto btn-primary text-sm py-2 px-4">Subscribe</Link>
                  </div>
                </div>
              )}

              {/* Score list */}
              <div className="card-dark p-6">
                <h3 className="font-semibold mb-4">Your Score Card ({scores.length}/5)</h3>
                {scores.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No scores yet. Add your first score above.</p>
                ) : (
                  <div className="space-y-3">
                    {scores.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-medium">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-300">{formatDate(s.played_at)}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                          {s.score}
                        </div>
                        <button
                          onClick={() => deleteScore(s.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {scores.length >= 5 && (
                  <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle size={16} />
                    You&apos;re entered in the next draw!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DRAWS ── */}
          {tab === 'draws' && (
            <div>
              <h1 className="text-2xl font-bold mb-2">Draws & Winnings</h1>
              <p className="text-slate-400 text-sm mb-8">Track your draw participation and prize history.</p>

              {latestDraw && (
                <div className="card-dark p-6 mb-6 border-emerald-500/20">
                  <h3 className="font-semibold mb-4 text-emerald-400">
                    Latest Draw — {new Date(latestDraw.year, latestDraw.month - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-3 mb-4">
                    {latestDraw.draw_numbers.map((n, i) => (
                      <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/25">
                        {n}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                      <div className="text-sm text-yellow-400 font-medium">Jackpot</div>
                      <div className="text-lg font-bold text-white">{formatCurrency(latestDraw.jackpot_amount + latestDraw.jackpot_rollover)}</div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                      <div className="text-sm text-emerald-400 font-medium">4-Match</div>
                      <div className="text-lg font-bold text-white">{formatCurrency(latestDraw.four_match_pool)}</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                      <div className="text-sm text-blue-400 font-medium">3-Match</div>
                      <div className="text-lg font-bold text-white">{formatCurrency(latestDraw.three_match_pool)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card-dark p-6">
                <h3 className="font-semibold mb-4">My Draw History</h3>
                {myResults.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No draw participation yet. Add 5 scores to enter the next draw!</p>
                ) : (
                  <div className="space-y-3">
                    {myResults.map((r) => (
                      <div key={r.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{r.match_count}-Number Match</div>
                          {r.prize_amount > 0 ? (
                            <span className="text-emerald-400 font-bold">{formatCurrency(r.prize_amount)}</span>
                          ) : (
                            <span className="text-slate-500 text-sm">No prize</span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap mb-2">
                          {r.user_scores.map((s, i) => (
                            <span key={i} className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                              latestDraw?.draw_numbers.includes(s)
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-700 text-slate-300'
                            }`}>{s}</span>
                          ))}
                        </div>
                        {r.prize_amount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              r.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                              r.payment_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {r.payment_status.toUpperCase()}
                            </span>
                            {r.payment_status === 'pending' && !r.proof_url && (
                              <button className="text-xs text-emerald-400 flex items-center gap-1 hover:text-emerald-300">
                                <Upload size={12} /> Upload Proof
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CHARITY ── */}
          {tab === 'charity' && (
            <div>
              <h1 className="text-2xl font-bold mb-2">My Charity</h1>
              <p className="text-slate-400 text-sm mb-8">Manage your charity selection and contribution percentage.</p>

              {charity && (
                <div className="card-dark p-6 mb-6 border-emerald-500/20">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Heart size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{charity.name}</h3>
                      <p className="text-slate-400 text-sm">{charity.description.slice(0, 80)}...</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-sm text-emerald-400 font-medium">Your Contribution: {profile?.charity_percentage}%</div>
                    <div className="text-xs text-slate-400 mt-1">
                      ≈ {formatCurrency((profile?.charity_percentage || 10) / 100 * (profile?.subscription_plan === 'yearly' ? 179.99 / 12 : 19.99))} per month
                    </div>
                  </div>
                </div>
              )}

              {/* Change charity */}
              <div className="card-dark p-6">
                <h3 className="font-semibold mb-4">Change Charity</h3>
                <div className="grid grid-cols-1 gap-2 mb-6 max-h-72 overflow-y-auto">
                  {charities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateCharity(c.id, profile?.charity_percentage || 10)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        profile?.charity_id === c.id
                          ? 'border-emerald-500/60 bg-emerald-500/10'
                          : 'border-slate-700/50 hover:border-slate-600'
                      }`}
                    >
                      <Heart size={16} className="text-emerald-400 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        {c.category && <div className="text-xs text-slate-500">{c.category}</div>}
                      </div>
                      {profile?.charity_id === c.id && (
                        <CheckCircle size={16} className="ml-auto text-emerald-400" />
                      )}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="label-dark">Contribution Percentage: {profile?.charity_percentage || 10}%</label>
                  <input
                    type="range"
                    min={10}
                    max={50}
                    value={profile?.charity_percentage || 10}
                    onChange={(e) => {
                      if (profile?.charity_id) updateCharity(profile.charity_id, parseInt(e.target.value))
                    }}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>10% (minimum)</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
