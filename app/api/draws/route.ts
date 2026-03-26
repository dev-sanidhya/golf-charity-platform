import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { runDraw, calculatePrizePools } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'published')
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    return NextResponse.json({ draws: data || [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch draws' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    )
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { draw_type = 'random', simulate = true } = await req.json()

    // Get all user scores for algorithmic draw
    const { data: allScores } = await supabase.from('scores').select('score')
    const scoreArr = (allScores || []).map((s) => s.score)

    const drawNumbers = runDraw(scoreArr, draw_type)

    // Get active subscriber count for prize pool calc
    const { count: activeCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active')

    const pools = calculatePrizePools(activeCount || 0, 19.99)

    if (simulate) {
      return NextResponse.json({ draw_numbers: drawNumbers, pools, simulated: true })
    }

    // Publish draw
    const now = new Date()
    const { data: draw, error } = await supabase.from('draws').upsert({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      draw_numbers: drawNumbers,
      draw_type,
      status: 'published',
      jackpot_amount: pools.jackpot,
      jackpot_rollover: 0,
      four_match_pool: pools.fourMatch,
      three_match_pool: pools.threeMatch,
      total_participants: activeCount || 0,
      published_at: new Date().toISOString(),
    }, { onConflict: 'month,year' }).select().single()

    if (error) throw error

    return NextResponse.json({ draw, published: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to process draw' }, { status: 500 })
  }
}
