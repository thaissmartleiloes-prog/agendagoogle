import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook chamado pelo Google quando um evento muda no Calendar
// Configure em: Google Cloud Console > APIs > Calendar > Push Notifications
export async function POST(req: NextRequest) {
  const channelId = req.headers.get('x-goog-channel-id')
  const resourceState = req.headers.get('x-goog-resource-state')

  if (resourceState === 'sync') {
    return NextResponse.json({ ok: true }) // handshake inicial
  }

  // Busca o usuário dono deste canal
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('google_calendar_channel_id', channelId)
    .single()

  if (!user?.google_refresh_token) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  // Busca eventos recentes do calendário do usuário
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({ refresh_token: user.google_refresh_token })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const now = new Date()
  const { data: events } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date(now.getTime() - 60000).toISOString(), // último 1 minuto
    updatedMin: new Date(now.getTime() - 60000).toISOString(),
    singleEvents: true,
  })

  for (const event of events.items || []) {
    if (!event.id) continue

    // Busca o agendamento correspondente no banco
    const { data: appt } = await supabase
      .from('appointments')
      .select('*')
      .eq('google_event_id', event.id)
      .single()

    if (!appt) continue

    // Atualiza data/hora se mudou no Google Calendar
    const newDate = event.start?.dateTime?.substring(0, 10)
    const newStart = event.start?.dateTime?.substring(11, 16)
    const newEnd = event.end?.dateTime?.substring(11, 16)

    if (newDate && newStart && newEnd) {
      if (newDate !== appt.date || newStart !== appt.start_time || newEnd !== appt.end_time) {
        await supabase.from('appointments').update({
          date: newDate,
          start_time: newStart,
          end_time: newEnd,
          rescheduled_from: { date: appt.date, start_time: appt.start_time }
        }).eq('id', appt.id)
      }
    }

    // Se o evento foi cancelado no Google, marca como perdido
    if (event.status === 'cancelled') {
      await supabase.from('appointments').update({ status: 'perdido' }).eq('id', appt.id)
    }
  }

  return NextResponse.json({ ok: true })
}
