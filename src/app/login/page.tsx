'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const USERS = [
  { name: 'Thais Massucato', email: 'thais_smartleiloes@gmail.com', role: 'Coordenador', avatar: 'TM', color: 'green' },
  { name: 'Camila Santiago', email: 'camilasousasantiago123@gmail.com', role: 'Closer / Team Leader', avatar: 'CS', color: 'blue' },
  { name: 'Natália Rodrigues', email: 'natalia.smartleiloes@gmail.com', role: 'Closer', avatar: 'NR', color: 'purple' },
  { name: 'Ellen Campos', email: 'ellen.launx@gmail.com', role: 'Closer', avatar: 'EC', color: 'amber' },
  { name: 'Barbara Rocha', email: 'barbararocha.smart@gmail.com', role: 'Closer', avatar: 'BR', color: 'teal' },
  { name: 'Eyshila Tamires', email: 'tamires.launx@gmail.com', role: 'Closer / SDR', avatar: 'ET', color: 'red' },
  { name: 'Lucas Zuppo', email: 'lucas.smartlink@gmail.com', role: 'Closer / SDR', avatar: 'LZ', color: 'green' },
  { name: 'Luiz Phillipe', email: 'luiz.launx@gmail.com', role: 'SDR / Closer', avatar: 'LP', color: 'blue' },
]

const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  green:  { bg: '#e8f4ef', text: '#134f36' },
  blue:   { bg: '#e8eef8', text: '#1a4a8a' },
  purple: { bg: '#eee8f8', text: '#4a1a8a' },
  amber:  { bg: '#f8f1e8', text: '#8a5a1a' },
  teal:   { bg: '#e8f4f4', text: '#1a6b6b' },
  red:    { bg: '#f8e8e8', text: '#8a1a1a' },
}

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleLogin(email: string) {
    setLoading(email)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/agenda`,
        shouldCreateUser: false, // só usuários pré-cadastrados
      },
    })
    if (error) {
      alert('Erro ao enviar link: ' + error.message)
      setLoading(null)
      return
    }
    alert(`Link de acesso enviado para ${email}!\nVerifique sua caixa de entrada.`)
    setLoading(null)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f4f0 0%, #e8f4ef 100%)', padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '36px 32px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ width: 10, height: 10, background: '#1a6b4a', borderRadius: '50%' }} />
          <span style={{ fontWeight: 600, fontSize: 18, color: '#1a6b4a' }}>Smart Agenda</span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Bem-vindo!</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>
          Selecione seu nome para receber o link de acesso no seu e-mail.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {USERS.map(u => {
            const c = AVATAR_COLORS[u.color]
            return (
              <button
                key={u.email}
                onClick={() => handleLogin(u.email)}
                disabled={!!loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: loading === u.email ? '#f0faf5' : 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textAlign: 'left', width: '100%',
                  transition: 'all 0.12s',
                  opacity: loading && loading !== u.email ? 0.5 : 1,
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: c.bg, color: c.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600, flexShrink: 0,
                }}>
                  {u.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{u.role}</div>
                </div>
                <div style={{ fontSize: 16, color: 'var(--text3)' }}>
                  {loading === u.email ? '...' : '›'}
                </div>
              </button>
            )
          })}
        </div>

        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>
          O acesso é feito por link mágico enviado ao seu e-mail corporativo.
        </p>
      </div>
    </div>
  )
}
