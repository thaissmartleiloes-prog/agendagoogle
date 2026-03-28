'use client'
// A página /agenda carrega o sistema completo.
// O componente principal está em src/components/AgendaApp.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, User } from '@/lib/supabase'
import AgendaApp from '@/components/AgendaApp'

export default function AgendaPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }

      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single()

      if (!userProfile) { router.push('/login'); return }

      setUser(userProfile)
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
        <div style={{ color:'var(--text3)', fontSize:14 }}>Carregando agenda...</div>
      </div>
    )
  }

  return <AgendaApp currentUser={user!} />
}
