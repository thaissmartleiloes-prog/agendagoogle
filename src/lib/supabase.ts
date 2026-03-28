import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos do banco de dados
export type UserRole = 'admin' | 'leader' | 'closer' | 'sdr'
export type AppointmentStatus = 'agendada' | 'realizada' | 'ncompareceu' | 'remarcada' | 'venda' | 'perdido'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  role_label: string
  products: string[]
  avatar: string
  color: string
  google_refresh_token?: string
  google_calendar_id?: string
}

export interface Appointment {
  id: string
  lead_name: string
  lead_phone?: string
  lead_email?: string
  lead_origin?: string
  product: string
  responsible_id: string
  sdr_id?: string
  date: string        // YYYY-MM-DD
  start_time: string  // HH:MM
  end_time: string    // HH:MM
  status: AppointmentStatus
  meet_link?: string
  observations?: string
  google_event_id?: string
  rescheduled_from?: { date: string; start_time: string }
  created_at: string
  updated_at: string
  // joins
  responsible?: User
  sdr?: User
}
