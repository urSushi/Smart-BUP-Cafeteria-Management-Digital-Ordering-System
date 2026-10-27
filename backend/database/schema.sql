-- ============================================================================
-- SMART BUP CAFETERIA MANAGEMENT SYSTEM (SBCMS)
-- PostgreSQL Relational Database Schema
-- Based on the University Cafeteria Chen ER Diagram
-- ============================================================================

-- Drop existing tables if re-initializing (in reverse dependency order)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS guests CASCADE;
DROP TABLE IF EXISTS staffs CASCADE;
DROP TABLE IF EXISTS officers CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cafeteria_stocks_item CASCADE;
DROP TABLE IF EXISTS cafeteria_offers_item CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS admin_manages_cafeteria CASCADE;
DROP TABLE IF EXISTS cafeterias CASCADE;
DROP TABLE IF EXISTS system_admins CASCADE;

-- ----------------------------------------------------------------------------
-- 1. SYSTEM_ADMIN Entity
-- Attributes: admin_id (PK), name, email, password_hash
-- ----------------------------------------------------------------------------
CREATE TABLE system_admins (
    admin_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. CAFETERIA Entity
-- Attributes: cafeteria_id (PK), name, location, opening_hours
-- ----------------------------------------------------------------------------
CREATE TABLE cafeterias (
    cafeteria_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    opening_hours VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. MANAGES Relationship (M:N between SYSTEM_ADMIN and CAFETERIA)
-- ----------------------------------------------------------------------------
CREATE TABLE admin_manages_cafeteria (
    admin_id VARCHAR(50) NOT NULL REFERENCES system_admins(admin_id) ON DELETE CASCADE,
    cafeteria_id VARCHAR(50) NOT NULL REFERENCES cafeterias(cafeteria_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (admin_id, cafeteria_id)
);

-- ----------------------------------------------------------------------------
-- 4. MENU_ITEM Entity
-- Attributes: item_id (PK), name, category, description, price, is_available
-- ----------------------------------------------------------------------------
CREATE TABLE menu_items (
    item_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. OFFERS Relationship (M:N between CAFETERIA and MENU_ITEM)
-- ----------------------------------------------------------------------------
CREATE TABLE cafeteria_offers_item (
    cafeteria_id VARCHAR(50) NOT NULL REFERENCES cafeterias(cafeteria_id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL REFERENCES menu_items(item_id) ON DELETE CASCADE,
    PRIMARY KEY (cafeteria_id, item_id)
);

-- ----------------------------------------------------------------------------
-- 6. STOCKS Relationship (M:N with relationship attributes: quantity, low_stock_threshold)
-- ----------------------------------------------------------------------------
CREATE TABLE cafeteria_stocks_item (
    cafeteria_id VARCHAR(50) NOT NULL REFERENCES cafeterias(cafeteria_id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL REFERENCES menu_items(item_id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cafeteria_id, item_id)
);

-- ----------------------------------------------------------------------------
-- 7. USER Entity (Superclass for Disjoint ISA hierarchy)
-- Attributes: user_id (PK), name, email, password_hash, phone
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'faculty', 'officer', 'staff', 'guest')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 8. STUDENT Subclass (ISA USER)
-- Attributes: student_id (PK/FK to users.user_id), department, batch
-- ----------------------------------------------------------------------------
CREATE TABLE students (
    student_id VARCHAR(50) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    batch VARCHAR(50) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 9. FACULTY Subclass (ISA USER)
-- Attributes: faculty_id (PK/FK to users.user_id), department, designation
-- ----------------------------------------------------------------------------
CREATE TABLE faculties (
    faculty_id VARCHAR(50) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 10. OFFICER Subclass (ISA USER)
-- Attributes: officer_id (PK/FK to users.user_id), rank, office
-- ----------------------------------------------------------------------------
CREATE TABLE officers (
    officer_id VARCHAR(50) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    rank VARCHAR(100) NOT NULL,
    office VARCHAR(150) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 11. STAFF Subclass (ISA USER)
-- Attributes: staff_id (PK/FK to users.user_id), section
-- ----------------------------------------------------------------------------
CREATE TABLE staffs (
    staff_id VARCHAR(50) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    section VARCHAR(100) NOT NULL
);

-- ----------------------------------------------------------------------------
-- 12. GUEST Subclass (ISA USER)
-- Attributes: guest_code (PK/FK to users.user_id), valid_until
-- ----------------------------------------------------------------------------
CREATE TABLE guests (
    guest_code VARCHAR(50) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ----------------------------------------------------------------------------
-- 13. ORDER Entity
-- Attributes: order_id (PK), user_id (FK), cafeteria_id (FK), order_time,
--             status, total_amount, pickup_token, qr_code, expires_at
-- Relationships: PLACES (USER -> ORDER), RECEIVES (CAFETERIA -> ORDER)
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
    order_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(user_id) ON DELETE SET NULL,
    cafeteria_id VARCHAR(50) REFERENCES cafeterias(cafeteria_id) ON DELETE SET NULL,
    order_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'completed', 'cancelled', 'refund_pending')),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    pickup_token VARCHAR(30),
    qr_code TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ----------------------------------------------------------------------------
-- 14. ORDER_ITEM Weak Entity / Associative Entity
-- Relationship: CONTAINS (ORDER -> ORDER_ITEM), REFERENCES MENU_ITEM
-- Attributes: order_id (PK/FK), item_id (PK/FK), quantity, unit_price
-- ----------------------------------------------------------------------------
CREATE TABLE order_items (
    order_id VARCHAR(50) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL REFERENCES menu_items(item_id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    PRIMARY KEY (order_id, item_id)
);

-- ----------------------------------------------------------------------------
-- 15. PAYMENT Entity
-- Relationship: PAID_BY (ORDER -> PAYMENT, 1:1)
-- Attributes: payment_id (PK), order_id (FK UNIQUE), method, amount,
--             txn_ref, status, paid_at
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    payment_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL CHECK (method IN ('bkash', 'nagad', 'upay', 'cash', 'card')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    txn_ref VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'paid', 'unpaid', 'refund_pending')),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 16. REVIEW Entity
-- Relationships: WRITES (USER -> REVIEW), REVIEWS (REVIEW -> MENU_ITEM)
-- Attributes: review_id (PK), user_id (FK), item_id (FK), rating, comment, review_date
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
    review_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL REFERENCES menu_items(item_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    review_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_cafeteria_id ON orders(cafeteria_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_stocks_cafeteria ON cafeteria_stocks_item(cafeteria_id);
CREATE INDEX idx_reviews_item ON reviews(item_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
