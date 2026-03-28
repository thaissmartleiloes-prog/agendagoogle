'use client'
import { useState, useEffect } from 'react'
import { User, Appointment, AppointmentStatus } from '@/lib/supabase'

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'agendada',    label: 'Agendada' },
  { value: 'realizada',  label: 'Realizada' },
  { value: 'ncompareceu',label: 'Não compareceu' },
  { value: 'remarcada',  label: 'Remarcada' },
  { value: 'venda',      label: 'Venda' },
  { value: 'perdido',    label: 'Perdido' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  agendada:    { bg:'#e8eef8', text:'#185FA5' },
  realizada:   { bg:'#e8f4ef', text:'#0F6E56' },
  ncompareceu: { bg:'#f8f1e8', text:'#BA7517' },
  remarcada:   { bg:'#eee8f8', text:'#534AB7' },
  venda:       { bg:'#e8f8e8', text:'#1a6b1a' },
  perdido:     { bg:'#f8e8e8', text:'#A32D2D' },
}

interface Props {
  mode: 'new' | 'edit'
  appointment: Appointment | null
  defaultDate?: string
  defaultTime?: string
  allUsers: User[]
  currentUser: User
  onSave: (data: Partial<Appointment>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

export default function AppointmentModal({ mode, appointment, defaultDate, defaultTime, allUsers, currentUser, onSave, onDelete, onClose }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    lead_name: appointment?.lead_name || '',
    lead_phone: appointment?.lead_phone || '',
    lead_email: appointment?.lead_email || '',
    lead_origin: appointment?.lead_origin || '',
    product: appointment?.product || 'Assessoria',
    responsible_id: appointment?.responsible_id || currentUser.id,
    sdr_id: appointment?.sdr_id || '',
    date: appointment?.date || defaultDate || today,
    start_time: appointment?.start_time || defaultTime || '09:00',
    end_time: appointment?.end_time || '09:45',
    status: appointment?.status || 'agendada' as AppointmentStatus,
    meet_link: appointment?.meet_link || '',
    observations: appointment?.observations || '',
  })
  const [conflict, setConflict] = useState(false)
  const [saving, setSaving] = useState(false)

  // Verifica conflito ao mudar responsável/data/horário
  useEffect(() => {
    async function check() {
      if (!form.responsible_id || !form.date || !form.start_time || !form.end_time) return
      const res = await fetch(`/api/appointments?userId=${form.responsible_id}&role=admin&date=${form.date}`)
      const appts: Appointment[] = await res.json()
      const hasConflict = appts.some(a => {
        if (appointment && a.id === appointment.id) return false
        return form.start_time < a.end_time && form.end_time > a.start_time
      })
      setConflict(hasConflict)
    }
    check()
  }, [form.responsible_id, form.date, form.start_time, form.end_time, appointment])

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.lead_name.trim()) { alert('Nome do lead é obrigatório.'); return }
    if (conflict) { alert('Conflito de horário! Escolha outro horário ou responsável.'); return }
    setSaving(true)
    await onSave(form as Partial<Appointment>)
    setSaving(false)
  }

  const inp: React.CSSProperties = {
    padding:'7px 10px', border:'1px solid rgba(0,0,0,0.13)', borderRadius:8,
    fontFamily:'DM Sans, sans-serif', fontSize:13, color:'var(--text)', background:'white',
    outline:'none', width:'100%',
  }
  const lbl: React.CSSProperties = { fontSize:11, fontWeight:600, color:'var(--text2)', letterSpacing:'0.3px', marginBottom:4, display:'block' }
  const row2: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }
  const row3: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }

  const closers = allUsers.filter(u => u.role === 'closer' || u.role === 'leader' || u.role === 'sdr')
  const sdrs = allUsers.filter(u => u.role === 'sdr')

  const st = STATUS_COLORS[form.status]

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.35)',
        zIndex:200, display:'flex', alignItems:'center', justifyContent:'center',
        animation:'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background:'white', borderRadius:12, width:560, maxWidth:'95vw', maxHeight:'90vh',
        overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding:'16px 20px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          fontWeight:600, fontSize:15, position:'sticky', top:0, background:'white', zIndex:1,
        }}>
          {mode === 'new' ? 'Novo agendamento' : 'Editar agendamento'}
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:'50%', border:'1px solid var(--border)',
            background:'white', cursor:'pointer', fontSize:16, display:'flex',
            alignItems:'center', justifyContent:'center',
          }}>×</button>
        </div>

        <div style={{ padding:20 }}>
          {/* Conflict alert */}
          {conflict && (
            <div style={{
              background:'#f8f1e8', border:'1px solid rgba(186,117,23,0.3)',
              borderRadius:8, padding:'10px 12px', fontSize:12, color:'#BA7517',
              marginBottom:12, display:'flex', gap:8, alignItems:'center',
            }}>
              ⚠ Conflito de horário! Este responsável já tem compromisso neste horário.
            </div>
          )}

          {/* GCal info */}
          <div style={{
            background:'#e8eef8', border:'1px solid rgba(26,74,138,0.15)',
            borderRadius:8, padding:'8px 12px', fontSize:12, color:'#1a4a8a',
            marginBottom:16, display:'flex', gap:8, alignItems:'center',
          }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#1a4a8a' }} />
            Será sincronizado com o Google Calendar do responsável automaticamente
          </div>

          {/* Lead */}
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text2)', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:10 }}>
            Dados do lead
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>Nome do lead *</label>
              <input style={inp} value={form.lead_name} onChange={e => set('lead_name', e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <label style={lbl}>Telefone</label>
              <input style={inp} value={form.lead_phone} onChange={e => set('lead_phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>E-mail</label>
              <input style={inp} type="email" value={form.lead_email} onChange={e => set('lead_email', e.target.value)} placeholder="lead@email.com" />
            </div>
            <div>
              <label style={lbl}>Produto de interesse *</label>
              <select style={inp} value={form.product} onChange={e => set('product', e.target.value)}>
                {['Assessoria','Tubarões','Arena','LIC','DZA'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Origem do lead</label>
            <select style={inp} value={form.lead_origin} onChange={e => set('lead_origin', e.target.value)}>
              {['','Indicação','Instagram','Facebook','Google Ads','Site','Cold call','LinkedIn','WhatsApp','Evento'].map(o => (
                <option key={o} value={o}>{o || 'Não informada'}</option>
              ))}
            </select>
          </div>

          <div style={{ height:1, background:'var(--border)', margin:'16px 0' }} />

          {/* Agenda */}
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text2)', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:10 }}>
            Agendamento
          </div>
          <div style={row3}>
            <div>
              <label style={lbl}>Data *</label>
              <input style={inp} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Início *</label>
              <input style={inp} type="time" step={900} value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Término *</label>
              <input style={inp} type="time" step={900} value={form.end_time} onChange={e => set('end_time', e.target.value)} />
            </div>
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>Closer responsável *</label>
              <select style={{ ...inp, borderColor: conflict ? '#BA7517' : undefined }} value={form.responsible_id} onChange={e => set('responsible_id', e.target.value)}>
                {closers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role_label})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>SDR responsável</label>
              <select style={inp} value={form.sdr_id} onChange={e => set('sdr_id', e.target.value)}>
                <option value="">Nenhum</option>
                {sdrs.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>Status *</label>
              <select style={{ ...inp, background: st?.bg, color: st?.text, fontWeight:500 }} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Link da reunião</label>
              <input style={inp} value={form.meet_link} onChange={e => set('meet_link', e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
          </div>
          <div>
            <label style={lbl}>Observações</label>
            <textarea style={{ ...inp, minHeight:70, resize:'vertical' }} value={form.observations} onChange={e => set('observations', e.target.value)} placeholder="Notas sobre o lead, contexto da reunião..." />
          </div>

          {mode === 'edit' && appointment?.rescheduled_from && (
            <div style={{ marginTop:12, background:'var(--surface2)', borderRadius:8, padding:'8px 12px', fontSize:11, color:'var(--text2)' }}>
              Remarcado de: {appointment.rescheduled_from.date} às {appointment.rescheduled_from.start_time}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:'14px 20px', borderTop:'1px solid var(--border)',
          display:'flex', justifyContent:'flex-end', gap:8,
          background:'#f9f8f5', borderBottomLeftRadius:12, borderBottomRightRadius:12,
        }}>
          {mode === 'edit' && appointment && (
            <button onClick={() => onDelete(appointment.id)} style={{
              padding:'6px 12px', borderRadius:8, border:'1px solid rgba(138,26,26,0.3)',
              background:'white', color:'#8a1a1a', fontSize:12, cursor:'pointer',
              fontFamily:'DM Sans, sans-serif', marginRight:'auto',
            }}>Excluir</button>
          )}
          <button onClick={onClose} style={{
            padding:'6px 12px', borderRadius:8, border:'1px solid var(--border)',
            background:'white', fontSize:12, cursor:'pointer', fontFamily:'DM Sans, sans-serif',
          }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || conflict} style={{
            padding:'6px 16px', borderRadius:8, border:'none',
            background: conflict ? '#ccc' : '#1a6b4a', color:'white',
            fontSize:12, fontWeight:500, cursor: conflict ? 'not-allowed' : 'pointer',
            fontFamily:'DM Sans, sans-serif',
          }}>
            {saving ? 'Salvando...' : mode === 'new' ? 'Confirmar agendamento' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
