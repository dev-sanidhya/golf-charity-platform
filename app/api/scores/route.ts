import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    )
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(5)

    return NextResponse.json({ scores: data || [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    )
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check active subscription
    const { data: profile } = await supabase.from('profiles').select('subscription_status').eq('id', user.id).single()
    if (profile?.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
    }

    const { score, played_at } = await req.json()

    if (!score || !played_at) return NextResponse.json({ error: 'Score and date required' }, { status: 400 })
    if (score < 1 || score > 45) return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })

    // Rolling 5: delete oldest if at limit
    const { data: existing } = await supabase.from('scores').select('id, played_at').eq('user_id', user.id).order('played_at', { ascending: true })

    if (existing && existing.length >= 5) {
      await supabase.from('scores').delete().eq('id', existing[0].id)
    }

    const { data, error } = await supabase.from('scores').insert({ user_id: user.id, score, played_at }).select().single()
    if (error) throw error

    return NextResponse.json({ score: data })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to add score' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    )
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    await supabase.from('scores').delete().eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete score' }, { status: 500 })
  }
}
