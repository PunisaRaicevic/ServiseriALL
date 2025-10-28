-- =================================================================
-- SUPABASE - DODAJ SAMO NOVE KOLONE (Čuva postojeće podatke)
-- =================================================================
-- Ova skripta dodaje samo kolone koje nedostaju
-- =================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- PROFILES - Dodaj nove kolone ako ne postoje
-- =================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_role VARCHAR DEFAULT 'technician';

-- =================================================================
-- CLIENTS - Dodaj nove kolone ako ne postoje
-- =================================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_pib VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_pdv VARCHAR;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_account VARCHAR;

-- =================================================================
-- APPLIANCES - Dodaj nove kolone ako ne postoje
-- =================================================================
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS appliance_maker VARCHAR;
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS appliance_iga VARCHAR;
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS appliance_picture VARCHAR;
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS last_service_date DATE;
ALTER TABLE appliances ADD COLUMN IF NOT EXISTS next_service_date DATE;

-- =================================================================
-- TASKS - Dodaj recurring tasks kolone ako ne postoje
-- =================================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id VARCHAR;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_auto_generated INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_occurrence_date DATE;

-- Dodaj foreign key constraint za parent_task_id ako ne postoji
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tasks_parent_fk'
    ) THEN
        ALTER TABLE tasks
        ADD CONSTRAINT tasks_parent_fk 
        FOREIGN KEY (parent_task_id) 
        REFERENCES tasks(task_id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- =================================================================
-- REPORTS - Dodaj nove kolone ako ne postoje
-- =================================================================
ALTER TABLE reports ADD COLUMN IF NOT EXISTS spare_parts_used TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS work_duration INTEGER;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS photos TEXT;

-- =================================================================
-- Kreiraj DOCUMENTS tabelu ako ne postoji
-- =================================================================
CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    document_name VARCHAR NOT NULL,
    document_type VARCHAR,
    document_url VARCHAR NOT NULL,
    related_to VARCHAR,
    related_id VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- Kreiraj SPARE_PARTS tabelu ako ne postoji
-- =================================================================
CREATE TABLE IF NOT EXISTS spare_parts (
    part_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    part_name VARCHAR NOT NULL,
    part_number VARCHAR,
    part_manufacturer VARCHAR,
    quantity_in_stock INTEGER DEFAULT 0,
    minimum_stock_level INTEGER DEFAULT 0,
    unit_price DECIMAL(10, 2),
    location VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- INDEXES (Dodaj samo ako ne postoje)
-- =================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(client_name);
CREATE INDEX IF NOT EXISTS idx_clients_pib ON clients(client_pib);

-- Appliances indexes
CREATE INDEX IF NOT EXISTS idx_appliances_client ON appliances(client_id);
CREATE INDEX IF NOT EXISTS idx_appliances_serial ON appliances(appliance_serial);
CREATE INDEX IF NOT EXISTS idx_appliances_next_service ON appliances(next_service_date);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_appliance ON tasks(appliance_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(task_due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_recurring_due ON tasks(task_type, next_occurrence_date) 
    WHERE task_type = 'recurring';

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_task ON reports(task_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_related ON documents(related_to, related_id);

-- Spare parts indexes
CREATE INDEX IF NOT EXISTS idx_spare_parts_name ON spare_parts(part_name);
CREATE INDEX IF NOT EXISTS idx_spare_parts_number ON spare_parts(part_number);

-- =================================================================
-- GOTOVO! Nove kolone su dodate! 🎉
-- =================================================================
