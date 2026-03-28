'use client'
import { Appointment, User } from '@/lib/supabase'

// ===================== SHARED UTILS =====================

export const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  agendada:    { bg:'#e8eef8', border:'#185FA5', text:'#185FA5' },
  realizada:   { bg:'#e8f4ef', border:'#0F6E56', text:'#0F6E56' },
  ncompareceu: { bg:'#f8f1e8', border:'#BA7517', text:'#BA7517' },
  remarcada:   { bg:'#eee8f8', border:'#534AB7', text:'#534AB7' },
  venda:       { bg:'#e8f8e8', border:'#1a6b1a', text:'#1a6b1a' },
  perdido:     { bg:'#f8e8e8', border:'#A32D2D', text:'#A32D2D' },
}

export const STATUS_LABELS: Record<string, string> = {
  agendada:'Agendada', realizada:'Realizada', ncompareceu:'Não compareceu',
  remarcada:'Remarcada', venda:'Venda', perdido:'Perdido',
}

export const USER_COLORS: Record<string, string> = {
  green:'#1a6b4a', blue:'#1a4a8a', purple:'#4a1a8a',
  amber:'#8a5a1a', teal:'#1a6b6b', red:'#8a1a1a',
}
export const USER_BG: Record<string, string> = {
  green:'#e8f4ef', blue:'#e8eef8', purple:'#eee8f8',
  amber:'#f8f1e8', teal:'#e8f4f4', red:'#f8e8e8',
}

function timeToRow(time: string) {
  const [h, m] = time.split(':').map(Number)
  return (h - 8) * 4 + Math.floor(m / 15)
}
function durationRows(start: string, end: string) {
  return Math.max(timeToRow(end) - timeToRow(start), 2)
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.agendada
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', padding:'2px 7px',
      borderRadius:20, fontSize:10, fontWeight:600,
      background:c.bg, color:c.text,
    }}>{STATUS_LABELS[status]}</span>
  )
}

// ===================== WEEK VIEW =====================

const WEEK_DAYS = ['Seg','Ter','Qua','Qui','Sex']
const HOURS: string[] = []
for (let h = 8; h <= 19; h++) for (let m = 0; m < 60; m += 15) HOURS.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)

function getWeekDates(): Date[] {
  const today = new Date(2025, 2, 28)
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - day + 1)
  return Array.from({ length: 5 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

interface ViewProps {
  appointments: Appointment[]
  onCellClick: (date?: string, time?: string) => void
  onApptClick: (appt: Appointment) => void
}

export function WeekView({ appointments, onCellClick, onApptClick }: ViewProps) {
  const weekDates = getWeekDates()
  return (
    <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'grid', gridTemplateColumns:'52px repeat(5,1fr)', borderBottom:'1px solid var(--border)' }}>
        <div />
        {weekDates.map((d, i) => {
          const isToday = d.getDate() === 28 && d.getMonth() === 2
          return (
            <div key={i} style={{ padding:'10px 8px', textAlign:'center', borderRight: i<4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text2)' }}>{WEEK_DAYS[i]}</div>
              <div style={{ fontSize:20, fontWeight:300, color: isToday ? '#1a6b4a' : 'var(--text)', lineHeight:1.2 }}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>
      {/* Body */}
      <div style={{ display:'flex' }}>
        <div style={{ width:52, flexShrink:0 }}>
          {HOURS.map(t => (
            <div key={t} style={{ height:22, display:'flex', alignItems:'flex-start', padding:'1px 6px 0 2px', borderRight:'1px solid var(--border)' }}>
              {t.endsWith(':00') && <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'DM Mono,monospace' }}>{t}</span>}
            </div>
          ))}
        </div>
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(5,1fr)' }}>
          {weekDates.map((d, di) => {
            const ds = dateStr(d)
            const dayAppts = appointments.filter(a => a.date === ds)
            return (
              <div key={di} style={{ position:'relative', borderRight: di<4 ? '1px solid var(--border)' : 'none' }}>
                {HOURS.map((t, ri) => (
                  <div key={t} onClick={() => onCellClick(ds, t)} style={{
                    height:22, cursor:'pointer',
                    borderTop: t.endsWith(':00') ? '1px solid rgba(0,0,0,0.04)' : 'none',
                    transition:'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background='#e8f4ef')}
                  onMouseLeave={e => (e.currentTarget.style.background='')}
                  />
                ))}
                {dayAppts.map(a => {
                  const responsible = a.responsible as unknown as User
                  const color = responsible?.color || 'green'
                  const rowStart = timeToRow(a.start_time)
                  const rowH = durationRows(a.start_time, a.end_time)
                  return (
                    <div key={a.id} onClick={() => onApptClick(a)} style={{
                      position:'absolute', left:2, right:2,
                      top: rowStart * 22 + 2, height: rowH * 22 - 4,
                      background: USER_BG[color] || '#e8f4ef',
                      borderLeft: `3px solid ${USER_COLORS[color] || '#1a6b4a'}`,
                      borderRadius:4, padding:'2px 5px', fontSize:11, fontWeight:500,
                      cursor:'pointer', overflow:'hidden', zIndex:5,
                      color: USER_COLORS[color] || '#1a6b4a',
                    }}>
                      <div style={{ fontSize:10, fontWeight:600 }}>{a.start_time}</div>
                      <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.lead_name}</div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ===================== DAY VIEW =====================

export function DayView({ appointments, onCellClick, onApptClick }: ViewProps) {
  const ds = '2025-03-28'
  const dayAppts = appointments.filter(a => a.date === ds).sort((a, b) => a.start_time.localeCompare(b.start_time))

  return (
    <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:16 }}>
      {/* Timeline */}
      <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', textAlign:'center' }}>
          <div style={{ fontSize:11, color:'var(--text2)', fontWeight:600 }}>Sexta</div>
          <div style={{ fontSize:22, fontWeight:300, color:'#1a6b4a' }}>28</div>
        </div>
        <div style={{ display:'flex' }}>
          <div style={{ width:48, flexShrink:0 }}>
            {HOURS.map(t => (
              <div key={t} style={{ height:22, padding:'1px 4px 0', borderRight:'1px solid var(--border)' }}>
                {t.endsWith(':00') && <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'DM Mono,monospace' }}>{t}</span>}
              </div>
            ))}
          </div>
          <div style={{ flex:1, position:'relative' }}>
            {HOURS.map(t => (
              <div key={t} onClick={() => onCellClick(ds, t)} style={{
                height:22, cursor:'pointer',
                borderTop: t.endsWith(':00') ? '1px solid rgba(0,0,0,0.04)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background='#e8f4ef')}
              onMouseLeave={e => (e.currentTarget.style.background='')}
              />
            ))}
            {dayAppts.map(a => {
              const responsible = a.responsible as unknown as User
              const color = responsible?.color || 'green'
              const rowStart = timeToRow(a.start_time)
              const rowH = durationRows(a.start_time, a.end_time)
              return (
                <div key={a.id} onClick={() => onApptClick(a)} style={{
                  position:'absolute', left:2, right:2,
                  top: rowStart*22+2, height: rowH*22-4,
                  background: USER_BG[color], borderLeft:`3px solid ${USER_COLORS[color]}`,
                  borderRadius:4, padding:'3px 6px', fontSize:11, fontWeight:500,
                  cursor:'pointer', color: USER_COLORS[color], zIndex:5,
                }}>
                  <div style={{ fontSize:10 }}>{a.start_time}</div>
                  <div>{a.lead_name}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* List */}
      <div>
        <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            Hoje — 28/03
            <span style={{ fontSize:12, color:'var(--text3)', fontWeight:400 }}>{dayAppts.length} compromissos</span>
          </div>
          {dayAppts.length === 0 && (
            <div style={{ padding:24, textAlign:'center', color:'var(--text3)', fontSize:13 }}>Nenhum compromisso hoje</div>
          )}
          {dayAppts.map(a => <ListItem key={a.id} appt={a} onClick={() => onApptClick(a)} />)}
        </div>
      </div>
    </div>
  )
}

// ===================== LIST ITEM =====================

function ListItem({ appt: a, onClick }: { appt: Appointment; onClick: () => void }) {
  const responsible = a.responsible as unknown as User
  const color = responsible?.color || 'green'
  return (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'10px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer',
      transition:'background 0.1s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background='#f9f8f5')}
    onMouseLeave={e => (e.currentTarget.style.background='')}
    >
      <span style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:'var(--text3)', width:48, flexShrink:0 }}>{a.start_time}</span>
      <div style={{ width:3, height:36, borderRadius:2, background:USER_COLORS[color], flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:500, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.lead_name}</div>
        <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>
          {responsible?.name?.split(' ')[0] || ''} · {a.product} · {a.start_time}–{a.end_time}
        </div>
      </div>
      <StatusBadge status={a.status} />
    </div>
  )
}

// ===================== LIST VIEW =====================

export function ListView({ appointments, onNewClick, onApptClick }: { appointments: Appointment[]; onNewClick: () => void; onApptClick: (a: Appointment) => void }) {
  const sorted = [...appointments].sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
  const grouped: Record<string, Appointment[]> = {}
  sorted.forEach(a => { if (!grouped[a.date]) grouped[a.date] = []; grouped[a.date].push(a) })

  const statusCounts = Object.entries(STATUS_LABELS).map(([k, label]) => ({
    key: k, label, count: appointments.filter(a => a.status === k).length
  }))

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
      <div>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:12 }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              {date === '2025-03-28' ? 'Hoje, 28 de Março' : date === '2025-03-29' ? 'Amanhã, 29 de Março' : date}
              <span style={{ fontSize:12, color:'var(--text3)', fontWeight:400 }}>{items.length} compromisso{items.length > 1 ? 's' : ''}</span>
            </div>
            {items.map(a => <ListItem key={a.id} appt={a} onClick={() => onApptClick(a)} />)}
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Nenhum agendamento encontrado</div>
        )}
      </div>
      <div>
        <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:13 }}>Status</div>
          {statusCounts.map(s => {
            const c = STATUS_COLORS[s.key]
            return (
              <div key={s.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 16px', borderBottom:'1px solid var(--border)' }}>
                <span style={{ display:'inline-flex', padding:'2px 7px', borderRadius:20, fontSize:10, fontWeight:600, background:c.bg, color:c.text }}>{s.label}</span>
                <span style={{ fontWeight:600, fontSize:13 }}>{s.count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ===================== STATS VIEW =====================

export function StatsView({ appointments, allUsers, currentUser }: { appointments: Appointment[]; allUsers: User[]; currentUser: User }) {
  const today = appointments.filter(a => a.date === '2025-03-28')
  const vendas = appointments.filter(a => a.status === 'venda').length
  const realizadas = appointments.filter(a => a.status === 'realizada').length
  const taxa = appointments.length > 0 ? Math.round((vendas / appointments.length) * 100) : 0

  const canSeeAll = currentUser.role === 'admin' || currentUser.role === 'leader'

  return (
    <div>
      {/* Stats cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Hoje', value: today.length, sub:'Agendamentos' },
          { label:'Realizadas', value: realizadas, sub:'No período' },
          { label:'Vendas', value: vendas, sub:'Fechamentos', accent: true },
          { label:'Conversão', value: `${taxa}%`, sub:'Venda / total' },
        ].map((s, i) => (
          <div key={i} style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6, fontWeight:500 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:300, color: s.accent ? '#1a6b4a' : 'var(--text)' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--text2)', marginTop:4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Por colaborador */}
        {canSeeAll && (
          <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:13 }}>Por colaborador</div>
            {allUsers.map(u => {
              const uAppts = appointments.filter(a => a.responsible_id === u.id)
              const uVendas = uAppts.filter(a => a.status === 'venda').length
              return (
                <div key={u.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{
                    width:28, height:28, borderRadius:'50%', flexShrink:0,
                    background: USER_BG[u.color] || '#e8f4ef', color: USER_COLORS[u.color] || '#1a6b4a',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600,
                  }}>{u.avatar}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500 }}>{u.name}</div>
                    <div style={{ fontSize:10, color:'var(--text2)' }}>{u.role_label}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:600 }}>{uAppts.length}</div>
                    <div style={{ fontSize:10, color:'#1a6b4a' }}>{uVendas} venda{uVendas !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Por status */}
        <div style={{ background:'white', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:13 }}>Por status</div>
          {Object.entries(STATUS_LABELS).map(([k, label]) => {
            const count = appointments.filter(a => a.status === k).length
            const pct = appointments.length > 0 ? Math.round(count / appointments.length * 100) : 0
            const c = STATUS_COLORS[k]
            return (
              <div key={k} style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ display:'inline-flex', padding:'2px 7px', borderRadius:20, fontSize:10, fontWeight:600, background:c.bg, color:c.text }}>{label}</span>
                  <span style={{ fontSize:12, fontWeight:600 }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height:4, background:'#f0f0ee', borderRadius:2 }}>
                  <div style={{ height:4, background:c.border, borderRadius:2, width:`${pct}%`, transition:'width 0.3s' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
