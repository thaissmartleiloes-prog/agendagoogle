'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase, User, Appointment } from '@/lib/supabase'
import { getGoogleAuthUrl } from '@/lib/google-calendar'
import { WeekView, DayView, ListView, StatsView } from './WeekView'
import AppointmentModal from './AppointmentModal'

const AVATAR_COLORS: Record<string, string> = {
  green:'#1a6b4a', blue:'#1a4a8a', purple:'#4a1a8a',
  amber:'#8a5a1a', teal:'#1a6b6b', red:'#8a1a1a',
}
const AVATAR_BG: Record<string, string> = {
  green:'#e8f4ef', blue:'#e8eef8', purple:'#eee8f8',
  amber:'#f8f1e8', teal:'#e8f4f4', red:'#f8e8e8',
}

export default function AgendaApp({ currentUser }: { currentUser: User }) {
  const [view, setView] = useState<'week'|'day'|'list'|'stats'>('week')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [modal, setModal] = useState<null|'new'|'edit'>(null)
  const [editingAppt, setEditingAppt] = useState<Appointment|null>(null)
  const [newApptTime, setNewApptTime] = useState<{date:string;time:string}|null>(null)
  const [filterUser, setFilterUser] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterProduct, setFilterProduct] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchAppointments = useCallback(async () => {
    const params = new URLSearchParams({
      userId: currentUser.id,
      role: currentUser.role,
    })
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (filterProduct !== 'all') params.set('product', filterProduct)

    const res = await fetch(`/api/appointments?${params}`)
    const data = await res.json()
    setAppointments(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [currentUser, filterStatus, filterProduct])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  useEffect(() => {
    supabase.from('users').select('*').then(({ data }) => { if (data) setAllUsers(data) })
  }, [])

  // Filtra por usuário (admin/leader)
  const visibleAppts = filterUser === 'all'
    ? appointments
    : appointments.filter(a => a.responsible_id === filterUser)

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function openNewModal(date?: string, time?: string) {
    setEditingAppt(null)
    setNewApptTime(date ? { date, time: time || '09:00' } : null)
    setModal('new')
  }

  function openEditModal(appt: Appointment) {
    setEditingAppt(appt)
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditingAppt(null)
    setNewApptTime(null)
  }

  async function handleSave(data: Partial<Appointment>) {
    if (modal === 'new') {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingAppt?.id, ...data }),
      })
    }
    closeModal()
    fetchAppointments()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este agendamento?')) return
    await fetch(`/api/appointments?id=${id}`, { method: 'DELETE' })
    closeModal()
    fetchAppointments()
  }

  const avatarStyle = (u: User) => ({
    width: 26, height: 26, borderRadius: '50%',
    background: AVATAR_BG[u.color] || '#e8f4ef',
    color: AVATAR_COLORS[u.color] || '#1a6b4a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 600, flexShrink: 0,
  } as React.CSSProperties)

  const canSeeAllUsers = currentUser.role === 'admin' || currentUser.role === 'leader'

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg)' }}>

      {/* TOP BAR */}
      <div style={{
        background:'white', borderBottom:'1px solid var(--border)',
        padding:'0 16px', height:52, display:'flex', alignItems:'center', gap:16,
        position:'sticky', top:0, zIndex:100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:600, fontSize:15, color:'#1a6b4a' }}>
          <div style={{ width:8, height:8, background:'#1a6b4a', borderRadius:'50%' }} />
          Smart Agenda
        </div>

        {currentUser.google_refresh_token ? (
          <div style={{
            background:'#e8eef8', border:'1px solid rgba(26,74,138,0.15)',
            borderRadius:6, padding:'4px 10px', fontSize:11, color:'#1a4a8a',
            display:'flex', alignItems:'center', gap:6,
          }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#1a4a8a', animation:'pulse 2s infinite' }} />
            Google Calendar sincronizado
          </div>
        ) : (
          <a href={getGoogleAuthUrl(currentUser.id)} style={{
            background:'#f8f1e8', border:'1px solid rgba(138,90,26,0.2)',
            borderRadius:6, padding:'4px 10px', fontSize:11, color:'#8a5a1a',
            textDecoration:'none',
          }}>
            ⚠ Conectar Google Calendar
          </a>
        )}

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:11, color:'var(--text3)' }}>{currentUser.role_label}</div>
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'5px 10px', borderRadius:20, background:'var(--surface2)',
            border:'1px solid var(--border)',
          }}>
            <div style={avatarStyle(currentUser)}>{currentUser.avatar}</div>
            <span style={{ fontSize:12, fontWeight:500 }}>{currentUser.name.split(' ')[0]}</span>
          </div>
          <button onClick={logout} style={{
            padding:'5px 10px', borderRadius:6, border:'1px solid var(--border)',
            background:'white', fontSize:11, cursor:'pointer',
          }}>Sair</button>
        </div>
      </div>

      {/* LAYOUT */}
      <div style={{ display:'flex', flex:1 }}>

        {/* SIDEBAR */}
        <div style={{
          width:220, flexShrink:0, background:'white',
          borderRight:'1px solid var(--border)', padding:'16px 0',
        }}>
          <div style={{ padding:'0 12px', marginBottom:8 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.8px', textTransform:'uppercase', padding:'8px 4px 4px' }}>
              Visualização
            </div>
            {(['week','day','list','stats'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'7px 10px', borderRadius:8, width:'100%', textAlign:'left',
                border:'none', background: view===v ? '#e8f4ef' : 'none',
                color: view===v ? '#1a6b4a' : 'var(--text2)',
                fontWeight: view===v ? 500 : 400, fontSize:13, cursor:'pointer',
                fontFamily:'DM Sans, sans-serif',
              }}>
                <span style={{ fontSize:14, width:18, textAlign:'center' }}>
                  {v==='week'?'▦':v==='day'?'◻':v==='list'?'☰':'◈'}
                </span>
                {v==='week'?'Semana':v==='day'?'Dia':v==='list'?'Lista':'Painel'}
              </button>
            ))}
          </div>

          {canSeeAllUsers && (
            <div style={{ padding:'0 12px', marginTop:8 }}>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--text3)', letterSpacing:'0.8px', textTransform:'uppercase', padding:'8px 4px 4px' }}>
                Equipe
              </div>
              {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                <div key={u.id} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'5px 6px', borderRadius:6, cursor:'pointer', fontSize:12, color:'var(--text2)',
                }}>
                  <div style={{ ...avatarStyle(u), width:22, height:22, fontSize:9 }}>{u.avatar}</div>
                  <span>{u.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAIN */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* TOOLBAR */}
          <div style={{
            background:'white', borderBottom:'1px solid var(--border)',
            padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
          }}>
            <button onClick={() => openNewModal()} style={{
              padding:'6px 14px', borderRadius:8, border:'none',
              background:'#1a6b4a', color:'white', fontSize:12, fontWeight:500, cursor:'pointer',
              fontFamily:'DM Sans, sans-serif',
            }}>
              + Novo agendamento
            </button>

            <div style={{ display:'flex', gap:2 }}>
              {(['day','week','list','stats'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding:'5px 10px', borderRadius:8, border:'none',
                  background: view===v ? '#e8f4ef' : 'none',
                  color: view===v ? '#1a6b4a' : 'var(--text2)',
                  fontWeight: view===v ? 500 : 400, fontSize:12, cursor:'pointer',
                  fontFamily:'DM Sans, sans-serif',
                }}>
                  {v==='week'?'Semana':v==='day'?'Dia':v==='list'?'Lista':'Painel'}
                </button>
              ))}
            </div>

            <div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap' }}>
              {canSeeAllUsers && (
                <select value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{
                  padding:'5px 8px', borderRadius:8, border:'1px solid var(--border2)',
                  background:'white', fontFamily:'DM Sans, sans-serif', fontSize:12, cursor:'pointer',
                }}>
                  <option value="all">Todos colaboradores</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>)}
                </select>
              )}
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
                padding:'5px 8px', borderRadius:8, border:'1px solid var(--border2)',
                background:'white', fontFamily:'DM Sans, sans-serif', fontSize:12, cursor:'pointer',
              }}>
                <option value="all">Todos status</option>
                <option value="agendada">Agendada</option>
                <option value="realizada">Realizada</option>
                <option value="ncompareceu">Não compareceu</option>
                <option value="remarcada">Remarcada</option>
                <option value="venda">Venda</option>
                <option value="perdido">Perdido</option>
              </select>
              <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} style={{
                padding:'5px 8px', borderRadius:8, border:'1px solid var(--border2)',
                background:'white', fontFamily:'DM Sans, sans-serif', fontSize:12, cursor:'pointer',
              }}>
                <option value="all">Todos produtos</option>
                {['Assessoria','Tubarões','Arena','LIC','DZA'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* CONTENT */}
          <div style={{ flex:1, overflowY:'auto', padding:16 }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Carregando...</div>
            ) : view === 'week' ? (
              <WeekView appointments={visibleAppts} onCellClick={openNewModal} onApptClick={openEditModal} />
            ) : view === 'day' ? (
              <DayView appointments={visibleAppts} onCellClick={openNewModal} onApptClick={openEditModal} />
            ) : view === 'list' ? (
              <ListView appointments={visibleAppts} onNewClick={() => openNewModal()} onApptClick={openEditModal} />
            ) : (
              <StatsView appointments={visibleAppts} allUsers={allUsers} currentUser={currentUser} />
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <AppointmentModal
          mode={modal}
          appointment={editingAppt}
          defaultDate={newApptTime?.date}
          defaultTime={newApptTime?.time}
          allUsers={allUsers}
          currentUser={currentUser}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
