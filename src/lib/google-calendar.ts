// Funções do Google Calendar ficam apenas nas rotas de API (server-side)
// Este arquivo exporta apenas a função de URL que não usa googleapis

export function getGoogleAuthUrl(userId: string) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/auth/google/callback`
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${userId}`
}
