-- =================================================================
-- SUPABASE - OBRIŠI SVE I KREIRAJ IZNOVA
-- =================================================================
-- UPOZORENJE: OVO ĆE OBRISATI SVE POSTOJEĆE PODATKE!
-- =================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- PRVO OBRIŠITE SVE POSTOJEĆE TABELE
-- =================================================================
DROP TABLE IF EXISTS spare_parts CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS appliances CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =================================================================
-- 1. PROFILES TABLE (Korisnici/Tehničari)
-- =================================================================
CREATE TABLE profiles (
    user_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    username VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    email VARCHAR UNIQUE,
    user_role VARCHAR DEFAULT 'technician',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 2. CLIENTS TABLE (Klijenti - Hoteli, Restorani)
-- =================================================================
CREATE TABLE clients (
    client_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    client_name VARCHAR NOT NULL,
    client_address VARCHAR,
    client_contact VARCHAR,
    client_pib VARCHAR,
    client_pdv VARCHAR,
    client_account VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 3. APPLIANCES TABLE (Aparati/Oprema)
-- =================================================================
CREATE TABLE appliances (
    appliance_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    client_id VARCHAR NOT NULL,
    appliance_maker VARCHAR,
    appliance_type VARCHAR,
    appliance_model VARCHAR,
    appliance_serial VARCHAR,
    appliance_iga VARCHAR,
    appliance_picture VARCHAR,
    last_service_date DATE,
    next_service_date DATE,
    appliance_install_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT appliances_client_fk 
        FOREIGN KEY (client_id) 
        REFERENCES clients(client_id) 
        ON DELETE CASCADE
);

-- =================================================================
-- 4. TASKS TABLE (Zadaci) - SA RECURRING POLJIMA
-- =================================================================
CREATE TABLE tasks (
    task_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    client_id VARCHAR NOT NULL,
    appliance_id VARCHAR,
    user_id VARCHAR,
    status TEXT NOT NULL DEFAULT 'pending',
    task_type TEXT NOT NULL DEFAULT 'one-time',
    task_description TEXT NOT NULL,
    task_due_date DATE,
    priority TEXT DEFAULT 'normal',
    
    -- Recurring tasks polja
    recurrence_pattern TEXT DEFAULT 'none',
    recurrence_interval INTEGER DEFAULT 1,
    parent_task_id VARCHAR,
    is_auto_generated INTEGER DEFAULT 0,
    next_occurrence_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    report_id VARCHAR,
    
    CONSTRAINT tasks_client_fk 
        FOREIGN KEY (client_id) 
        REFERENCES clients(client_id) 
        ON DELETE CASCADE,
    CONSTRAINT tasks_appliance_fk 
        FOREIGN KEY (appliance_id) 
        REFERENCES appliances(appliance_id) 
        ON DELETE SET NULL,
    CONSTRAINT tasks_user_fk 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(user_id) 
        ON DELETE SET NULL,
    CONSTRAINT tasks_parent_fk 
        FOREIGN KEY (parent_task_id) 
        REFERENCES tasks(task_id) 
        ON DELETE SET NULL
);

-- =================================================================
-- 5. REPORTS TABLE (Izveštaji)
-- =================================================================
CREATE TABLE reports (
    report_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    task_id VARCHAR NOT NULL,
    report_description TEXT NOT NULL,
    spare_parts_used TEXT,
    work_duration INTEGER,
    photos TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT reports_task_fk 
        FOREIGN KEY (task_id) 
        REFERENCES tasks(task_id) 
        ON DELETE CASCADE
);

-- =================================================================
-- 6. DOCUMENTS TABLE (Dokumenti)
-- =================================================================
CREATE TABLE documents (
    document_id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    document_name VARCHAR NOT NULL,
    document_type VARCHAR,
    document_url VARCHAR NOT NULL,
    related_to VARCHAR,
    related_id VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- 7. SPARE_PARTS TABLE (Rezervni delovi - Inventar)
-- =================================================================
CREATE TABLE spare_parts (
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
-- INDEXES ZA BOLJE PERFORMANSE
-- =================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Clients indexes
CREATE INDEX idx_clients_name ON clients(client_name);
CREATE INDEX idx_clients_pib ON clients(client_pib);

-- Appliances indexes
CREATE INDEX idx_appliances_client ON appliances(client_id);
CREATE INDEX idx_appliances_serial ON appliances(appliance_serial);
CREATE INDEX idx_appliances_next_service ON appliances(next_service_date);

-- Tasks indexes
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_appliance ON tasks(appliance_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(task_due_date);
CREATE INDEX idx_tasks_type ON tasks(task_type);
CREATE INDEX idx_tasks_recurring_due ON tasks(task_type, next_occurrence_date) 
    WHERE task_type = 'recurring';

-- Reports indexes
CREATE INDEX idx_reports_task ON reports(task_id);

-- Documents indexes
CREATE INDEX idx_documents_related ON documents(related_to, related_id);

-- Spare parts indexes
CREATE INDEX idx_spare_parts_name ON spare_parts(part_name);
CREATE INDEX idx_spare_parts_number ON spare_parts(part_number);

-- =================================================================
-- SVE JE KREIRANO! 🎉
-- =================================================================
