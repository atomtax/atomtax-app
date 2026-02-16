-- ================================================
-- Supabase Schema for ATOMTAX Project
-- Firebase → Supabase Migration
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. Users Table (사용자)
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ================================================
-- 2. Clients Table (고객사)
-- ================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(10),
    company_name VARCHAR(255) NOT NULL,
    business_number VARCHAR(20),
    representative VARCHAR(100),
    manager VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    business_type VARCHAR(100),
    business_item VARCHAR(100),
    start_date DATE,
    end_date DATE,
    contract_amount NUMERIC(15, 2),
    supply_amount NUMERIC(15, 2),
    tax_amount NUMERIC(15, 2),
    is_terminated BOOLEAN DEFAULT FALSE,
    termination_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_manager ON clients(manager);
CREATE INDEX IF NOT EXISTS idx_clients_number ON clients(number);
CREATE INDEX IF NOT EXISTS idx_clients_is_terminated ON clients(is_terminated);
CREATE INDEX IF NOT EXISTS idx_clients_business_number ON clients(business_number);

-- Unique constraint for number (only for active clients)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_unique_number 
    ON clients(number) 
    WHERE is_terminated = FALSE AND number IS NOT NULL AND number != '';

-- ================================================
-- 3. Trader Inventory Table (매매사업자 물건목록)
-- ================================================
CREATE TABLE IF NOT EXISTS trader_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    property_name VARCHAR(255) NOT NULL,
    address TEXT,
    detailed_address TEXT,
    land_area NUMERIC(15, 2),
    building_area NUMERIC(15, 2),
    acquisition_value NUMERIC(20, 2) DEFAULT 0,
    other_expenses NUMERIC(20, 2) DEFAULT 0,
    transfer_value NUMERIC(20, 2),
    transfer_income NUMERIC(20, 2),
    disposal_cost NUMERIC(20, 2) DEFAULT 0,
    acquisition_date DATE,
    transfer_date DATE,
    report_deadline DATE,
    prepaid_income_tax NUMERIC(20, 2) DEFAULT 0,
    prepaid_local_tax NUMERIC(20, 2) DEFAULT 0,
    over_85 VARCHAR(1) DEFAULT 'N',
    progress_stage VARCHAR(50) DEFAULT '미확인',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_client_id ON trader_inventory(client_id);
CREATE INDEX IF NOT EXISTS idx_inventory_progress_stage ON trader_inventory(progress_stage);
CREATE INDEX IF NOT EXISTS idx_inventory_transfer_date ON trader_inventory(transfer_date);
CREATE INDEX IF NOT EXISTS idx_inventory_report_deadline ON trader_inventory(report_deadline);

-- ================================================
-- 4. Expenses Table (필요경비 상세)
-- ================================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL REFERENCES trader_inventory(id) ON DELETE CASCADE,
    no INTEGER,
    expense_name VARCHAR(100),
    category TEXT,
    amount NUMERIC(20, 2),
    cost_approved VARCHAR(1) DEFAULT 'O',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_inventory_id ON expenses(inventory_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_name ON expenses(expense_name);

-- ================================================
-- 5. Documents Table (서류 업로드)
-- ================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL REFERENCES trader_inventory(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_inventory_id ON documents(inventory_id);

-- ================================================
-- 6. Row Level Security (RLS) Policies
-- ================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users: Only authenticated users can read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Clients: Authenticated users can do everything
CREATE POLICY "Authenticated users can view clients" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert clients" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clients" ON clients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clients" ON clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- Trader Inventory: Authenticated users can do everything
CREATE POLICY "Authenticated users can view inventory" ON trader_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert inventory" ON trader_inventory
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update inventory" ON trader_inventory
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete inventory" ON trader_inventory
    FOR DELETE USING (auth.role() = 'authenticated');

-- Expenses: Authenticated users can do everything
CREATE POLICY "Authenticated users can view expenses" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert expenses" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update expenses" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete expenses" ON expenses
    FOR DELETE USING (auth.role() = 'authenticated');

-- Documents: Authenticated users can do everything
CREATE POLICY "Authenticated users can view documents" ON documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert documents" ON documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update documents" ON documents
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete documents" ON documents
    FOR DELETE USING (auth.role() = 'authenticated');

-- ================================================
-- 7. Triggers for updated_at
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trader_inventory_updated_at BEFORE UPDATE ON trader_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 8. Sample Data (Optional - for testing)
-- ================================================

-- Insert test user
-- INSERT INTO users (email, name, role) VALUES
-- ('mail@atomtax.co.kr', '아톰세무회계', 'admin');

-- ================================================
-- Migration Complete
-- ================================================
