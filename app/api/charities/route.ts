import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data } = await supabase
      .from('charities')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('name')

    return NextResponse.json({ charities: data || [] })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch charities' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    )
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { data, error } = await supabase.from('charities').insert({ ...body, is_active: true, total_raised: 0 }).select().single()
    if (error) throw error

    return NextResponse.json({ charity: data })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create charity' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    )
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, ...updates } = await req.json()
    const { data, error } = await supabase.from('charities').update(updates).eq('id', id).select().single()
    if (error) throw error

    return NextResponse.json({ charity: data })
  } catch {
    return NextResponse.json({ error: 'Failed to update charity' }, { status: 500 })
  }
}
