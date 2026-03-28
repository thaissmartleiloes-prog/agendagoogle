-- =============================================
-- SMART AGENDA — SCHEMA DO BANCO DE DADOS
-- Execute no Supabase: SQL Editor > New Query
-- =============================================

-- Tabela de usuários do sistema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','leader','closer','sdr')),
  role_label TEXT NOT NULL,
  products TEXT[] NOT NULL DEFAULT '{}',
  avatar TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'green',
  google_refresh_token TEXT,
  google_calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  lead_email TEXT,
  lead_origin TEXT,
  product TEXT NOT NULL,
  responsible_id UUID REFERENCES users(id),
  sdr_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendada'
    CHECK (status IN ('agendada','realizada','ncompareceu','remarcada','venda','perdido')),
  meet_link TEXT,
  observations TEXT,
  google_event_id TEXT,
  rescheduled_from JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Histórico de status
CREATE TABLE appointment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  old_date DATE,
  new_date DATE,
  old_start_time TIME,
  new_start_time TIME,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  note TEXT
);

-- Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: registra histórico de mudanças
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> NEW.status OR OLD.date <> NEW.date OR OLD.start_time <> NEW.start_time THEN
    INSERT INTO appointment_history(appointment_id, old_status, new_status, old_date, new_date, old_start_time, new_start_time)
    VALUES(NEW.id, OLD.status, NEW.status, OLD.date, NEW.date, OLD.start_time, NEW.start_time);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes
  AFTER UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION log_appointment_changes();

-- =============================================
-- POLÍTICAS DE SEGURANÇA (Row Level Security)
-- =============================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admins e líderes veem tudo
CREATE POLICY "admins_see_all" ON appointments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE email = auth.jwt()->>'email' AND role IN ('admin','leader'))
  );

-- Closers veem apenas os próprios
CREATE POLICY "closers_own" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = auth.jwt()->>'email'
        AND u.role = 'closer'
        AND u.id = appointments.responsible_id
    )
  );

-- SDRs veem os que eles agendaram
CREATE POLICY "sdr_own" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.email = auth.jwt()->>'email'
        AND u.role = 'sdr'
        AND (u.id = appointments.sdr_id OR u.id = appointments.responsible_id)
    )
  );

-- =============================================
-- DADOS INICIAIS — USUÁRIOS
-- =============================================

INSERT INTO users (email, name, role, role_label, products, avatar, color) VALUES
('thais_smartleiloes@gmail.com',     'Thais Massucato',  'admin',  'Coordenador',        ARRAY['Administrador'],                              'TM', 'green'),
('camilasousasantiago123@gmail.com', 'Camila Santiago',  'leader', 'Closer / Team Leader',ARRAY['Assessoria','Tubarões','Arena'],               'CS', 'blue'),
('natalia.smartleiloes@gmail.com',   'Natália Rodrigues','closer', 'Closer',              ARRAY['Assessoria','Tubarões','Arena'],               'NR', 'purple'),
('ellen.launx@gmail.com',            'Ellen Campos',     'closer', 'Closer',              ARRAY['LIC','DZA'],                                  'EC', 'amber'),
('barbararocha.smart@gmail.com',     'Barbara Rocha',    'closer', 'Closer',              ARRAY['LIC','DZA'],                                  'BR', 'teal'),
('tamires.launx@gmail.com',          'Eyshila Tamires',  'sdr',    'Closer / SDR',        ARRAY['LIC','DZA','Arena'],                          'ET', 'red'),
('lucas.smartlink@gmail.com',        'Lucas Zuppo',      'sdr',    'Closer / SDR',        ARRAY['LIC','DZA','Assessoria','Tubarões','Arena'],   'LZ', 'green'),
('luiz.launx@gmail.com',             'Luiz Phillipe',    'sdr',    'SDR / Closer',        ARRAY['Assessoria','Tubarões','Arena'],               'LP', 'blue');
