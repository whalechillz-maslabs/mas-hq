-- ================================================
-- 브랜드 포트폴리오 시스템 데이터베이스 스키마
-- Version: 1.0.0
-- Created: 2025-12-19
-- ================================================

-- ====================================
-- 1. 브랜드 (Brands) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    brand_type VARCHAR(50), -- main, secondary, character, collab
    parent_brand_id UUID REFERENCES brands(id),
    logo_path TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_brands_code ON brands(code);
CREATE INDEX IF NOT EXISTS idx_brands_type ON brands(brand_type);
CREATE INDEX IF NOT EXISTS idx_brands_parent ON brands(parent_brand_id);

-- ====================================
-- 2. 제품 카테고리 (Product Categories) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 3. 제품 (Products) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    base_price INTEGER DEFAULT 0,
    embroidery_price INTEGER DEFAULT 0,
    print_price INTEGER DEFAULT 0,
    image_path TEXT,
    specifications JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

-- ====================================
-- 4. 주문 (Brand Orders) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS brand_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR(20) DEFAULT 'preparing', -- preparing, in_progress, completed, cancelled
    quantity INTEGER NOT NULL DEFAULT 1,
    product_price INTEGER DEFAULT 0,
    embroidery_fee INTEGER DEFAULT 0,
    total_amount INTEGER DEFAULT 0,
    final_amount INTEGER DEFAULT 0,
    order_details JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_brand ON brand_orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON brand_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON brand_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON brand_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_number ON brand_orders(order_number);

-- ====================================
-- 5. 업체 (Suppliers) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    website_url TEXT,
    api_available BOOLEAN DEFAULT false,
    min_order_quantity INTEGER DEFAULT 1,
    contact_info JSONB DEFAULT '{}',
    product_categories JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 6. 상품소싱 (Product Sourcing) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS product_sourcing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),
    price INTEGER DEFAULT 0,
    specifications JSONB DEFAULT '{}',
    size_guide JSONB DEFAULT '{}',
    image_path TEXT,
    recommendation_score INTEGER DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sourcing_supplier ON product_sourcing(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_category ON product_sourcing(product_category_id);

-- ====================================
-- 7. 디자인 (Product Designs) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS product_designs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    design_name VARCHAR(255) NOT NULL,
    logo_placement JSONB DEFAULT '{}',
    color_combination JSONB DEFAULT '{}',
    color_codes JSONB DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    design_image_path TEXT,
    sketch_image_path TEXT,
    final_image_path TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, approved, final
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_designs_product ON product_designs(product_id);
CREATE INDEX IF NOT EXISTS idx_designs_brand ON product_designs(brand_id);
CREATE INDEX IF NOT EXISTS idx_designs_status ON product_designs(status);

-- ====================================
-- 초기 데이터 입력
-- ====================================

-- 브랜드 데이터
INSERT INTO brands (name, code, description, brand_type) VALUES
('MASSGOO', 'MASSGOO', '메인 브랜드, 골프 굿즈 제작', 'main'),
('SINGSING', 'SINGSING', '골프 브랜드', 'main'),
('TOBY', 'TOBY', '캐릭터 브랜드 (Toto & Bibi)', 'character'),
('MUZIIK', 'MUZIIK', '콜라보 파트너 (외부 자산)', 'collab'),
('SECRET WEAPON', 'SECRET_WEAPON', 'MASSGOO 2차 브랜드', 'secondary'),
('SECRET FORCE', 'SECRET_FORCE', 'MASSGOO 2차 브랜드', 'secondary')
ON CONFLICT (code) DO NOTHING;

-- SECRET 브랜드의 parent_brand_id 업데이트
UPDATE brands 
SET parent_brand_id = (SELECT id FROM brands WHERE code = 'MASSGOO')
WHERE code IN ('SECRET_WEAPON', 'SECRET_FORCE');

-- 제품 카테고리 데이터
INSERT INTO product_categories (name, code, description, display_order) VALUES
('볼캡', 'ball-caps', '볼캡', 1),
('버킷햇', 'bucket-hats', '버킷햇', 2),
('클러치백', 'pouches', '클러치백', 3),
('티셔츠', 't-shirts', '티셔츠', 4),
('맨투맨', 'sweatshirts', '맨투맨', 5)
ON CONFLICT (code) DO NOTHING;

-- 업체 데이터
INSERT INTO suppliers (name, code, description, api_available, min_order_quantity, product_categories) VALUES
('마플', 'MARPPLE', '주요 제작 파트너', true, 1, '["ball-caps", "bucket-hats", "pouches", "t-shirts", "sweatshirts"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ====================================
-- RLS (Row Level Security) 정책 설정
-- ====================================

-- brands 테이블
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands_select_all" ON brands FOR SELECT USING (true);
CREATE POLICY "brands_insert_admin" ON brands FOR INSERT WITH CHECK (true);
CREATE POLICY "brands_update_admin" ON brands FOR UPDATE USING (true);
CREATE POLICY "brands_delete_admin" ON brands FOR DELETE USING (true);

-- product_categories 테이블
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_categories_select_all" ON product_categories FOR SELECT USING (true);
CREATE POLICY "product_categories_insert_admin" ON product_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "product_categories_update_admin" ON product_categories FOR UPDATE USING (true);
CREATE POLICY "product_categories_delete_admin" ON product_categories FOR DELETE USING (true);

-- products 테이블
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_all" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert_admin" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update_admin" ON products FOR UPDATE USING (true);
CREATE POLICY "products_delete_admin" ON products FOR DELETE USING (true);

-- brand_orders 테이블
ALTER TABLE brand_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_orders_select_all" ON brand_orders FOR SELECT USING (true);
CREATE POLICY "brand_orders_insert_admin" ON brand_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "brand_orders_update_admin" ON brand_orders FOR UPDATE USING (true);
CREATE POLICY "brand_orders_delete_admin" ON brand_orders FOR DELETE USING (true);

-- suppliers 테이블
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_select_all" ON suppliers FOR SELECT USING (true);
CREATE POLICY "suppliers_insert_admin" ON suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "suppliers_update_admin" ON suppliers FOR UPDATE USING (true);
CREATE POLICY "suppliers_delete_admin" ON suppliers FOR DELETE USING (true);

-- product_sourcing 테이블
ALTER TABLE product_sourcing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_sourcing_select_all" ON product_sourcing FOR SELECT USING (true);
CREATE POLICY "product_sourcing_insert_admin" ON product_sourcing FOR INSERT WITH CHECK (true);
CREATE POLICY "product_sourcing_update_admin" ON product_sourcing FOR UPDATE USING (true);
CREATE POLICY "product_sourcing_delete_admin" ON product_sourcing FOR DELETE USING (true);

-- product_designs 테이블
ALTER TABLE product_designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_designs_select_all" ON product_designs FOR SELECT USING (true);
CREATE POLICY "product_designs_insert_admin" ON product_designs FOR INSERT WITH CHECK (true);
CREATE POLICY "product_designs_update_admin" ON product_designs FOR UPDATE USING (true);
CREATE POLICY "product_designs_delete_admin" ON product_designs FOR DELETE USING (true);

