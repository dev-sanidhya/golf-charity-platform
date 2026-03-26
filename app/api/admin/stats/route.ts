import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { calculatePrizePools } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    )
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [
      { count: totalUsers },
      { count: activeSubscribers },
      { data: draws },
      { data: winners },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      supabase.from('draws').select('jackpot_amount, four_match_pool, three_match_pool').eq('status', 'published'),
      supabase.from('draw_results').select('prize_amount').gt('prize_amount', 0),
    ])

    const pools = calculatePrizePools(activeSubscribers || 0, 19.99)
    const charityTotal = (activeSubscribers || 0) * 19.99 * 0.1
    const totalPaidOut = (winners || []).reduce((sum, w) => sum + w.prize_amount, 0)

    return NextResponse.json({
      totalUsers,
      activeSubscribers,
      currentPrizePool: pools.total,
      charityTotal,
      totalPaidOut,
      drawCount: (draws || []).length,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
