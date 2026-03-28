import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
)

// URL para conectar o Google de um usuário
export function getGoogleAuthUrl(userId: string) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    state: userId,
  })
}

// Cria evento no Google Calendar do usuário
export async function createGoogleEvent(refreshToken: string, appointment: {
  lead_name: string
  date: string
  start_time: string
  end_time: string
  product: string
  meet_link?: string
  observations?: string
}) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const startDateTime = `${appointment.date}T${appointment.start_time}:00-03:00`
    const endDateTime = `${appointment.date}T${appointment.end_time}:00-03:00`

    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `[Smart Agenda] ${appointment.lead_name} — ${appointment.product}`,
        description: appointment.observations || '',
        start: { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: endDateTime, timeZone: 'America/Sao_Paulo' },
        ...(appointment.meet_link ? {
          location: appointment.meet_link,
          conferenceData: { entryPoints: [{ entryPointType: 'video', uri: appointment.meet_link }] }
        } : {}),
        colorId: '2', // Verde
      },
    })

    return event.data.id
  } catch (err) {
    console.error('Erro ao criar evento no Google Calendar:', err)
    return null
  }
}

// Atualiza evento no Google Calendar
export async function updateGoogleEvent(refreshToken: string, eventId: string, appointment: {
  lead_name: string
  date: string
  start_time: string
  end_time: string
  product: string
  status: string
  meet_link?: string
  observations?: string
}) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const statusEmoji: Record<string, string> = {
      agendada: '📅', realizada: '✅', ncompareceu: '⚠️',
      remarcada: '🔄', venda: '🏆', perdido: '❌'
    }

    await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary: `${statusEmoji[appointment.status] || ''} ${appointment.lead_name} — ${appointment.product}`,
        description: appointment.observations || '',
        start: { dateTime: `${appointment.date}T${appointment.start_time}:00-03:00`, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: `${appointment.date}T${appointment.end_time}:00-03:00`, timeZone: 'America/Sao_Paulo' },
      },
    })
  } catch (err) {
    console.error('Erro ao atualizar evento:', err)
  }
}

// Cancela evento no Google Calendar
export async function deleteGoogleEvent(refreshToken: string, eventId: string) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    await calendar.events.delete({ calendarId: 'primary', eventId })
  } catch (err) {
    console.error('Erro ao deletar evento:', err)
  }
}

// Busca eventos do Google Calendar para verificar conflitos
export async function getGoogleEvents(refreshToken: string, date: string): Promise<{ start: string; end: string }[]> {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const timeMin = `${date}T00:00:00-03:00`
    const timeMax = `${date}T23:59:59-03:00`

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return (res.data.items || [])
      .filter(e => e.start?.dateTime && e.end?.dateTime)
      .map(e => ({
        start: e.start!.dateTime!.substring(11, 16),
        end: e.end!.dateTime!.substring(11, 16),
      }))
  } catch (err) {
    console.error('Erro ao buscar eventos do Google:', err)
    return []
  }
}
