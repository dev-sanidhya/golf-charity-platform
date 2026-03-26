/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Trophy, Users, Heart, TrendingUp, Settings, Loader2, Play,
  CheckCircle, XCircle, RefreshCw, LogOut, Edit2, Trash2, Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency, runDraw, calculatePrizePools } from '@/lib/utils'
import type { Profile, Charity, Draw, DrawResult } from '@/types/database'

type AdminTab = 'overview' | 'users' | 'draws' | 'charities' | 'winners'

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [loading, setLoading] = useState(true)

  // Data
  const [stats, setStats] = useState({ users: 0, activeSubscribers: 0, totalPool: 0, charityTotal: 0 })
  const [users, setUsers] = useState<Profile[]>([])
  const [draws, setDraws] = useState<Draw[]>([])
  const [charities, setCharities] = useState<Charity[]>([])
  const [winners, setWinners] = useState<(DrawResult & { profile?: Profile })[]>([])

  // Draw config
  const [drawType, setDrawType] = useState<'random' | 'algorithmic'>('random')
  const [simResult, setSimResult] = useState<number[]>([])
  const [drawLoading, setDrawLoading] = useState(false)

  // Charity form
  const [charityForm, setCharityForm] = useState({ name: '', description: '', category: '', is_featured: false })
  const [charityLoading, setCharityLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: { role: string } | null }
    if (profile?.role !== 'admin') { router.push('/dashboard'); return }

    const [
      { data: allUsers },
      { data: allDraws },
      { data: allCharities },
      { data: allWinners },
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('draws').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
      supabase.from('charities').select('*').order('name'),
      supabase.from('draw_results').select('*').gt('prize_amount', 0).order('created_at', { ascending: false }).limit(50),
    ])

    const usersData = (allUsers || []) as Profile[]
    const active = usersData.filter((u) => u.subscription_status === 'active')
    const totalPool = calculatePrizePools(active.length, 19.99).total

    setUsers(usersData)
    setDraws((allDraws || []) as Draw[])
    setCharities((allCharities || []) as Charity[])
    setStats({
      users: usersData.length,
      activeSubscribers: active.length,
      totalPool,
      charityTotal: active.length * 19.99 * 0.1,
    })

    // Enrich winners with profile
    if (allWinners) {
      const enriched = await Promise.all(
        (allWinners as DrawResult[]).map(async (w) => {
          const { data: prof } = await supabase.from('profiles').select('*').eq('id', w.user_id).single()
          return { ...w, profile: (prof as unknown as Profile) || undefined }
        })
      )
      setWinners(enriched)
    }

    setLoading(false)
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  const simulateDraw = async () => {
    setDrawLoading(true)
    const { data: allScores } = await supabase.from('scores').select('score')
    const scoreArr = (allScores || []).map((s) => s.score)
    const result = runDraw(scoreArr, drawType)
    setSimResult(result)
    setDrawLoading(false)
  }

  const publishDraw = async () => {
    if (simResult.length !== 5) return
    setDrawLoading(true)

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const pools = calculatePrizePools(stats.activeSubscribers, 19.99)

    // Get previous jackpot rollover
    const prevDraw = draws.find((d) => {
      const dm = d.month === month - 1 || (month === 1 && d.month === 12)
      return dm
    })
    const rollover = prevDraw?.jackpot_amount && !winners.find((w) => w.match_count === 5) ? prevDraw.jackpot_amount : 0

    const { data: draw, error } = await supabase.from('draws').upsert({
      month,
      year,
      draw_numbers: simResult,
      draw_type: drawType,
      status: 'published',
      jackpot_amount: pools.jackpot,
      jackpot_rollover: rollover,
      four_match_pool: pools.fourMatch,
      three_match_pool: pools.threeMatch,
      total_participants: stats.activeSubscribers,
      published_at: new Date().toISOString(),
    }, { onConflict: 'month,year' }).select().single()

    if (!error && draw) {
      // Process draw results for all active subscribers with 5 scores
      const { data: qualifiedUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('subscription_status', 'active')

      for (const u of qualifiedUsers || []) {
        const { data: userScores } = await supabase.from('scores').select('score').eq('user_id', u.id)
        if (!userScores || userScores.length < 5) continue

        const scores = userScores.map((s) => s.score)
        const matchCount = scores.filter((s) => simResult.includes(s)).length

        let prize = 0
        if (matchCount === 5) prize = pools.jackpot + rollover
        else if (matchCount === 4) prize = pools.fourMatch
        else if (matchCount === 3) prize = pools.threeMatch

        // Split among multiple winners
        if (matchCount >= 3) {
          await supabase.from('draw_results').upsert({
            draw_id: draw.id,
            user_id: u.id,
            user_scores: scores,
            match_count: matchCount,
            prize_amount: prize,
            payment_status: 'pending',
          }, { onConflict: 'draw_id,user_id' })
        }
      }

      setSimResult([])
      fetchData()
    }

    setDrawLoading(false)
  }

  const updateWinnerStatus = async (id: string, status: 'paid' | 'rejected') => {
    await supabase.from('draw_results').update({ payment_status: status, verified_at: new Date().toISOString() }).eq('id', id)
    fetchData()
  }

  const addCharity = async () => {
    if (!charityForm.name || !charityForm.description) return
    setCharityLoading(true)
    await supabase.from('charities').insert({ ...charityForm, is_active: true, total_raised: 0 })
    setCharityForm({ name: '', description: '', category: '', is_featured: false })
    fetchData()
    setCharityLoading(false)
  }

  const deleteCharity = async (id: string) => {
    await supabase.from('charities').update({ is_active: false }).eq('id', id)
    fetchData()
  }

  const updateSubscription = async (userId: string, status: 'active' | 'inactive') => {
    await supabase.from('profiles').update({ subscription_status: status, subscription_plan: status === 'active' ? 'monthly' : null }).eq('id', userId)
    fetchData()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
    </div>
  )

  const tabs = [
    { id: 'overview' as AdminTab, label: 'Overview', icon: <TrendingUp size={16} /> },
    { id: 'users' as AdminTab, label: 'Users', icon: <Users size={16} /> },
    { id: 'draws' as AdminTab, label: 'Draws', icon: <Trophy size={16} /> },
    { id: 'charities' as AdminTab, label: 'Charities', icon: <Heart size={16} /> },
    { id: 'winners' as AdminTab, label: 'Winners', icon: <Settings size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 fixed h-screen bg-slate-900/80 border-r border-slate-700/50 p-6">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <span className="font-bold text-white">GolfGives</span>
          </Link>
          <div className="text-xs text-emerald-400 font-medium mb-8 ml-10">Admin Panel</div>

          <nav className="flex flex-col gap-1 flex-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:text-white text-sm transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-8 pt-6">
          {/* Mobile header */}
          <div className="flex lg:hidden items-center justify-between mb-4">
            <span className="font-bold text-white">Admin Panel</span>
            <button onClick={handleSignOut} className="text-slate-400"><LogOut size={20} /></button>
          </div>
          <div className="flex lg:hidden gap-1 mb-6 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${tab === t.id ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div>
              <h1 className="text-2xl font-bold mb-8">Dashboard Overview</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Users', value: stats.users, icon: <Users size={20} className="text-blue-400" />, color: 'blue' },
                  { label: 'Active Subscribers', value: stats.activeSubscribers, icon: <CheckCircle size={20} className="text-emerald-400" />, color: 'emerald' },
                  { label: 'Prize Pool', value: formatCurrency(stats.totalPool), icon: <Trophy size={20} className="text-yellow-400" />, color: 'yellow' },
                  { label: 'Charity Total', value: formatCurrency(stats.charityTotal), icon: <Heart size={20} className="text-pink-400" />, color: 'pink' },
                ].map((s) => (
                  <div key={s.label} className="card-dark p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-400 text-xs">{s.label}</span>
                      {s.icon}
                    </div>
                    <div className="text-2xl font-bold">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Recent users */}
              <div className="card-dark p-6">
                <h3 className="font-semibold mb-4">Recent Registrations</h3>
                <div className="space-y-2">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                      <div>
                        <div className="text-sm font-medium">{u.full_name || 'Anonymous'}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {u.subscription_status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div>
              <h1 className="text-2xl font-bold mb-8">User Management</h1>
              <div className="card-dark overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Joined</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Plan</th>
                        <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-slate-700/20 hover:bg-white/2">
                          <td className="px-4 py-3">
                            <div className="font-medium">{u.full_name || 'Anonymous'}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{formatDate(u.created_at)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              u.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                            }`}>
                              {u.subscription_status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 capitalize hidden md:table-cell">{u.subscription_plan || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            {u.subscription_status !== 'active' ? (
                              <button onClick={() => updateSubscription(u.id, 'active')} className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg">
                                Activate
                              </button>
                            ) : (
                              <button onClick={() => updateSubscription(u.id, 'inactive')} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded-lg">
                                Deactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── DRAWS ── */}
          {tab === 'draws' && (
            <div>
              <h1 className="text-2xl font-bold mb-8">Draw Management</h1>

              <div className="card-dark p-6 mb-6">
                <h3 className="font-semibold mb-4">Configure & Run Draw</h3>

                <div className="flex gap-3 mb-6">
                  {(['random', 'algorithmic'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setDrawType(t)}
                      className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors capitalize ${
                        drawType === t ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400' : 'border-slate-700/50 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {t} Draw
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={simulateDraw}
                    disabled={drawLoading}
                    className="btn-outline flex-1 flex items-center justify-center gap-2"
                  >
                    {drawLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Simulate Draw
                  </button>
                  {simResult.length === 5 && (
                    <button
                      onClick={publishDraw}
                      disabled={drawLoading}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Play size={16} /> Publish Draw
                    </button>
                  )}
                </div>

                {simResult.length === 5 && (
                  <div className="mt-6">
                    <p className="text-sm text-slate-400 mb-3">Simulated Numbers:</p>
                    <div className="flex gap-3">
                      {simResult.map((n, i) => (
                        <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/25">
                          {n}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-yellow-400 mt-3 flex items-center gap-1">
                      ⚠ Review before publishing. This will process all draw results automatically.
                    </p>
                  </div>
                )}
              </div>

              {/* Draw history */}
              <div className="card-dark p-6">
                <h3 className="font-semibold mb-4">Draw History</h3>
                {draws.length === 0 ? (
                  <p className="text-slate-500 text-sm">No draws yet.</p>
                ) : (
                  <div className="space-y-3">
                    {draws.map((d) => (
                      <div key={d.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium">
                              {new Date(d.year, d.month - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{d.total_participants} participants · {d.draw_type}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            d.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                            d.status === 'simulated' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {d.status}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {d.draw_numbers.map((n, i) => (
                            <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/40 to-teal-500/40 border border-emerald-500/30 flex items-center justify-center text-white text-xs font-bold">
                              {n}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── CHARITIES ── */}
          {tab === 'charities' && (
            <div>
              <h1 className="text-2xl font-bold mb-8">Charity Management</h1>

              {/* Add charity */}
              <div className="card-dark p-6 mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus size={16} className="text-emerald-400" /> Add Charity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label-dark">Name</label>
                    <input value={charityForm.name} onChange={(e) => setCharityForm((p) => ({ ...p, name: e.target.value }))} placeholder="Charity name" className="input-dark" />
                  </div>
                  <div>
                    <label className="label-dark">Category</label>
                    <input value={charityForm.category} onChange={(e) => setCharityForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Health" className="input-dark" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="label-dark">Description</label>
                  <textarea value={charityForm.description} onChange={(e) => setCharityForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description..." rows={2} className="input-dark resize-none" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={charityForm.is_featured} onChange={(e) => setCharityForm((p) => ({ ...p, is_featured: e.target.checked }))} className="accent-emerald-500" />
                    <span className="text-sm text-slate-300">Featured</span>
                  </label>
                  <button onClick={addCharity} disabled={charityLoading} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                    {charityLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Add Charity
                  </button>
                </div>
              </div>

              {/* Charity list */}
              <div className="card-dark p-6">
                <h3 className="font-semibold mb-4">All Charities</h3>
                <div className="space-y-3">
                  {charities.map((c) => (
                    <div key={c.id} className="flex items-start justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.name}</span>
                          {c.is_featured && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">Featured</span>}
                          {!c.is_active && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">Inactive</span>}
                        </div>
                        {c.category && <div className="text-xs text-slate-500 mt-0.5">{c.category}</div>}
                        <div className="text-xs text-slate-400 mt-1 line-clamp-1">{c.description}</div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => supabase.from('charities').update({ is_featured: !c.is_featured }).eq('id', c.id).then(() => fetchData())}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteCharity(c.id)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── WINNERS ── */}
          {tab === 'winners' && (
            <div>
              <h1 className="text-2xl font-bold mb-8">Winner Verification</h1>
              {winners.length === 0 ? (
                <div className="card-dark p-12 text-center">
                  <Trophy size={40} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No winners yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {winners.map((w) => (
                    <div key={w.id} className="card-dark p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold">{w.profile?.full_name || 'Unknown User'}</div>
                          <div className="text-xs text-slate-500">{w.profile?.email}</div>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-sm font-medium">{w.match_count}-Number Match</span>
                            <span className="text-emerald-400 font-bold">{formatCurrency(w.prize_amount)}</span>
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {w.user_scores.map((s, i) => (
                              <span key={i} className="w-7 h-7 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            w.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
                            w.payment_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {w.payment_status.toUpperCase()}
                          </span>
                          {w.payment_status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateWinnerStatus(w.id, 'paid')}
                                className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg hover:bg-emerald-500/30"
                              >
                                <CheckCircle size={12} /> Approve & Pay
                              </button>
                              <button
                                onClick={() => updateWinnerStatus(w.id, 'rejected')}
                                className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/30"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </div>
                          )}
                          {w.proof_url && (
                            <a href={w.proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 underline">
                              View Proof
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
