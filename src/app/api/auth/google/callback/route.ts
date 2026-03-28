import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state') // passamos userId como state

  if (!code || !userId) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=auth_failed`)
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
  )

  try {
    const { tokens } = await oauth2Client.getToken(code)

    // Salva o refresh_token no perfil do usuário
    await supabase
      .from('users')
      .update({ google_refresh_token: tokens.refresh_token })
      .eq('id', userId)

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?gcal=connected`)
  } catch (err) {
    console.error('Erro no callback do Google:', err)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=token_failed`)
  }
}
