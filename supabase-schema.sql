-- ============================================
-- Supabase Database Schema
-- 아톰세무회계 내부 데이터 관리 시스템
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 고객사 테이블 (clients)
-- ============================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT, -- 고객 번호
    company_name TEXT NOT NULL, -- 거래처명
    manager TEXT, -- 담당자
    business_number TEXT, -- 사업자번호
    ceo_name TEXT, -- 대표자
    contact TEXT, -- 연락처
    email TEXT, -- 이메일
    google_drive_folder TEXT, -- 구글 드라이브 폴더 URL
    real_estate_drive_folder TEXT, -- 매매사업자 부동산 폴더 URL
    resident_number TEXT, -- 주민등록번호
    corporate_number TEXT, -- 법인등록번호
    business_type TEXT, -- 업종
    business_item TEXT, -- 업태
    business_code TEXT, -- 업종코드
    postal_code TEXT, -- 우편번호
    address TEXT, -- 주소
    supply_amount NUMERIC DEFAULT 0, -- 공급가액
    tax_amount NUMERIC DEFAULT 0, -- 세액
    first_withdrawal_month TEXT, -- 최초 인출월
    hometax_id TEXT, -- 홈택스 아이디
    hometax_password TEXT, -- 홈택스 비밀번호
    is_terminated BOOLEAN DEFAULT false, -- 해임 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_clients_number ON clients(number);
CREATE INDEX idx_clients_company_name ON clients(company_name);
CREATE INDEX idx_clients_manager ON clients(manager);
CREATE INDEX idx_clients_is_terminated ON clients(is_terminated);
CREATE INDEX idx_clients_business_code ON clients(business_code);

-- ============================================
-- 2. 매매사업자 물건목록 테이블 (trader_inventory)
-- ============================================
CREATE TABLE trader_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    property_name TEXT, -- 물건명
    address TEXT, -- 소재지
    acquisition_value NUMERIC DEFAULT 0, -- 취득가액
    other_expenses NUMERIC DEFAULT 0, -- 기타필요경비
    transfer_value NUMERIC DEFAULT 0, -- 양도가액
    transfer_income NUMERIC DEFAULT 0, -- 양도소득
    disposal_cost NUMERIC DEFAULT 0, -- 처분비
    acquisition_date DATE, -- 취득일
    transfer_date DATE, -- 양도일
    report_deadline DATE, -- 신고기한
    prepaid_income_tax NUMERIC DEFAULT 0, -- 기납부 종소세
    prepaid_local_tax NUMERIC DEFAULT 0, -- 기납부 지방소득세
    over_85 TEXT DEFAULT 'N', -- 85초과 여부 (Y/N)
    progress_stage TEXT DEFAULT '미확인', -- 진행단계
    remarks TEXT, -- 비고
    land_area NUMERIC, -- 토지 면적
    building_area NUMERIC, -- 건물 면적
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_inventory_client_id ON trader_inventory(client_id);
CREATE INDEX idx_inventory_transfer_date ON trader_inventory(transfer_date);
CREATE INDEX idx_inventory_progress_stage ON trader_inventory(progress_stage);

-- ============================================
-- 3. 필요경비 상세 테이블 (expenses)
-- ============================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES trader_inventory(id) ON DELETE CASCADE,
    no INTEGER, -- 번호
    expense_name TEXT, -- 비용명
    category TEXT, -- 구분 ('취득가액' 또는 '기타필요경비')
    amount NUMERIC DEFAULT 0, -- 금액
    preliminary_approved TEXT DEFAULT 'O', -- 예정신고 비용인정 (O/X)
    income_tax_approved TEXT DEFAULT 'O', -- 종합소득세 비용인정 (O/X)
    note TEXT, -- 비고
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_expenses_inventory_id ON expenses(inventory_id);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ============================================
-- 4. Row Level Security (RLS) 설정
-- ============================================

-- clients 테이블 RLS 활성화
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 접근 가능
CREATE POLICY "Enable read access for authenticated users" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON clients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- trader_inventory 테이블 RLS 활성화
ALTER TABLE trader_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON trader_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON trader_inventory
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON trader_inventory
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON trader_inventory
    FOR DELETE USING (auth.role() = 'authenticated');

-- expenses 테이블 RLS 활성화
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON expenses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON expenses
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON expenses
    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 5. 함수 및 트리거 (자동 updated_at 갱신)
-- ============================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- clients 테이블 트리거
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- trader_inventory 테이블 트리거
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON trader_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. View 생성 (편의 기능)
-- ============================================

-- 고객사별 물건 수 및 총액 View
CREATE VIEW client_summary AS
SELECT 
    c.id,
    c.number,
    c.company_name,
    c.manager,
    c.is_terminated,
    COUNT(ti.id) as property_count,
    SUM(ti.transfer_value) as total_transfer_value,
    SUM(ti.acquisition_value) as total_acquisition_value,
    SUM(ti.transfer_income) as total_transfer_income
FROM clients c
LEFT JOIN trader_inventory ti ON c.id = ti.client_id
GROUP BY c.id, c.number, c.company_name, c.manager, c.is_terminated;

-- 물건별 필요경비 합계 View
CREATE VIEW inventory_expense_summary AS
SELECT 
    ti.id as inventory_id,
    ti.property_name,
    ti.client_id,
    SUM(CASE WHEN e.category = '취득가액' THEN e.amount ELSE 0 END) as acquisition_total,
    SUM(CASE WHEN e.category = '기타필요경비' THEN e.amount ELSE 0 END) as other_expenses_total,
    COUNT(e.id) as expense_count
FROM trader_inventory ti
LEFT JOIN expenses e ON ti.id = e.inventory_id
GROUP BY ti.id, ti.property_name, ti.client_id;

-- ============================================
-- 완료!
-- ============================================
-- 이 스키마를 Supabase SQL Editor에서 실행하세요.
