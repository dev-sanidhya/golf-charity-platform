'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Heart, Search, Star, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Charity } from '@/types/database'

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [filtered, setFiltered] = useState<Charity[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [categories, setCategories] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('charities')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name')
      .then(({ data }) => {
        const list = data || []
        setCharities(list)
        setFiltered(list)
        const cats = ['All', ...Array.from(new Set(list.map((c) => c.category).filter(Boolean) as string[]))]
        setCategories(cats)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let result = charities
    if (category !== 'All') result = result.filter((c) => c.category === category)
    if (search) result = result.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()))
    setFiltered(result)
  }, [search, category, charities])

  const featured = charities.filter((c) => c.is_featured)

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <Navbar />

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-3">Giving Back</p>
            <h1 className="text-5xl font-extrabold mb-4">Our Charity Partners</h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Every subscription contributes to one of these incredible organisations.
              Choose who receives your support.
            </p>
          </div>

          {/* Featured */}
          {featured.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star size={18} className="text-yellow-400" />
                Spotlight Charities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {featured.map((c) => (
                  <div key={c.id} className="card-dark p-6 border-yellow-500/20 relative overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Star size={10} /> Featured
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Heart size={24} className="text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{c.name}</h3>
                        {c.category && <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{c.category}</span>}
                        <p className="text-slate-400 text-sm mt-3 leading-relaxed">{c.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-emerald-400 font-bold">£{(c.total_raised).toFixed(0)}</span>
                            <span className="text-slate-500 ml-1">raised</span>
                          </div>
                          {c.website_url && (
                            <a href={c.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 flex items-center gap-1 hover:text-emerald-300">
                              Visit <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search charities..."
                className="input-dark pl-9"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-dark sm:w-40 bg-slate-800/50"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* All charities grid */}
          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading charities...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((c) => (
                <div key={c.id} className="card-dark p-6 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Heart size={20} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base leading-tight">{c.name}</h3>
                        {c.is_featured && <Star size={12} className="text-yellow-400 flex-shrink-0 mt-1" />}
                      </div>
                      {c.category && <span className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded mt-1 inline-block">{c.category}</span>}
                      <p className="text-slate-400 text-sm mt-2 leading-relaxed line-clamp-3">{c.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-emerald-400 font-bold">£{c.total_raised.toFixed(0)}</span>
                          <span className="text-slate-500 ml-1">raised</span>
                        </div>
                        {c.website_url && (
                          <a href={c.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1">
                            Website <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-3 text-center py-16">
                  <Heart size={40} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No charities match your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
