import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } from '@/lib/google-calendar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET — busca agendamentos (respeitando permissões)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const role = searchParams.get('role')
  const date = searchParams.get('date')
  const status = searchParams.get('status')
  const product = searchParams.get('product')

  let query = supabase
    .from('appointments')
    .select('*, responsible:users!responsible_id(*), sdr:users!sdr_id(*)')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  // Filtros de permissão
  if (role === 'closer') {
    query = query.eq('responsible_id', userId)
  } else if (role === 'sdr') {
    query = query.or(`responsible_id.eq.${userId},sdr_id.eq.${userId}`)
  }

  // Filtros opcionais
  if (date) query = query.eq('date', date)
  if (status && status !== 'all') query = query.eq('status', status)
  if (product && product !== 'all') query = query.eq('product', product)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — cria novo agendamento
export async function POST(req: NextRequest) {
  const body = await req.json()

  // 1. Verifica conflito no banco
  const { data: conflicts } = await supabase
    .from('appointments')
    .select('id')
    .eq('responsible_id', body.responsible_id)
    .eq('date', body.date)
    .neq('status', 'cancelado')
    .lt('start_time', body.end_time)
    .gt('end_time', body.start_time)

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: 'CONFLICT', message: 'Horário já ocupado para este responsável.' }, { status: 409 })
  }

  // 2. Insere no banco
  const { data, error } = await supabase
    .from('appointments')
    .insert([body])
    .select('*, responsible:users!responsible_id(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 3. Sincroniza com Google Calendar (se o responsável tiver conta conectada)
  if (data.responsible?.google_refresh_token) {
    const gcalId = await createGoogleEvent(data.responsible.google_refresh_token, {
      lead_name: data.lead_name,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      product: data.product,
      meet_link: data.meet_link,
      observations: data.observations,
    })
    if (gcalId) {
      await supabase.from('appointments').update({ google_event_id: gcalId }).eq('id', data.id)
    }
  }

  return NextResponse.json(data, { status: 201 })
}

// PUT — edita agendamento
export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  // Busca agendamento atual
  const { data: current } = await supabase
    .from('appointments')
    .select('*, responsible:users!responsible_id(*)')
    .eq('id', id)
    .single()

  // Se remarcando, salva data anterior
  if (updates.date && current?.date !== updates.date) {
    updates.rescheduled_from = { date: current?.date, start_time: current?.start_time }
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select('*, responsible:users!responsible_id(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sincroniza com Google Calendar
  if (data.google_event_id && data.responsible?.google_refresh_token) {
    await updateGoogleEvent(data.responsible.google_refresh_token, data.google_event_id, {
      lead_name: data.lead_name,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      product: data.product,
      status: data.status,
      meet_link: data.meet_link,
      observations: data.observations,
    })
  }

  return NextResponse.json(data)
}

// DELETE — remove agendamento
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  const { data: current } = await supabase
    .from('appointments')
    .select('*, responsible:users!responsible_id(*)')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Remove do Google Calendar
  if (current?.google_event_id && current?.responsible?.google_refresh_token) {
    await deleteGoogleEvent(current.responsible.google_refresh_token, current.google_event_id)
  }

  return NextResponse.json({ ok: true })
}
