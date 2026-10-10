-- ============================================================================
-- SMART BUP CAFETERIA MANAGEMENT SYSTEM (SBCMS)
-- PostgreSQL Seed Data
-- Conforms to the Chen ER Diagram entities, relationships, and ISA roles
-- ============================================================================

-- Note: Password hash for all demo users is bcrypt hash of 'password123'
-- ($2b$10$ep6f0dCUG1mB9g6w9Z/8d.F45KjIeKiqXl.s0gq30Gln2qg9r0eO2 or equivalent)

-- ----------------------------------------------------------------------------
-- 1. SYSTEM_ADMIN Entity
-- ----------------------------------------------------------------------------
INSERT INTO system_admins (admin_id, name, email, password_hash) VALUES
('ADM-001', 'System Administrator', 'admin@bup.edu.bd', '$2a$10$7rXmB8V9bE9tS3.8R9K3QeqM2Z0o1h8E5w6s9n1v3y8p0q2r4t6u8'),
('ADM-THP', 'Third Place Canteen Administrator', 'admin.monpura@bup.edu.bd', '$2a$10$7rXmB8V9bE9tS3.8R9K3QeqM2Z0o1h8E5w6s9n1v3y8p0q2r4t6u8')
ON CONFLICT (admin_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. CAFETERIA Entity
-- ----------------------------------------------------------------------------
INSERT INTO cafeterias (cafeteria_id, name, location, opening_hours) VALUES
('amitie', 'Amitie Cafeteria', 'Academic Building Ground Floor', '08:00 AM - 06:00 PM'),
('vista', 'Vista Cafe', 'Ground Floor of the Academic Building', '08:30 AM - 05:30 PM'),
('pitstop', 'Pitstop', 'Ground floor walkway', '09:00 AM - 07:00 PM'),
('monpura', 'Third Place', 'Monpura Lakeside Deck', '08:00 AM - 09:30 PM')
ON CONFLICT (cafeteria_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. MANAGES Relationship (SYSTEM_ADMIN <-> CAFETERIA)
-- ----------------------------------------------------------------------------
INSERT INTO admin_manages_cafeteria (admin_id, cafeteria_id) VALUES
('ADM-001', 'amitie'),
('ADM-001', 'vista'),
('ADM-001', 'pitstop'),
('ADM-001', 'monpura'),
('ADM-THP', 'monpura')
ON CONFLICT (admin_id, cafeteria_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. MENU_ITEM Entity
-- ----------------------------------------------------------------------------
INSERT INTO menu_items (item_id, name, category, description, price, is_available) VALUES
-- Amitie Breakfast & Snacks
('ami-01', 'Paratha', 'Breakfast', 'Freshly rolled crispy layered flatbread', 10.00, true),
('ami-02', 'Dal / Bhaji (Stir-fry)', 'Breakfast', 'Homestyle seasoned lentils or mixed vegetable stir-fry', 15.00, true),
('ami-03', 'Fried Egg', 'Breakfast', 'Sunny-side-up or well done seasoned farm egg', 20.00, true),
('ami-04', 'Singara (Samosa)', 'Snacks', 'Crispy spiced potato, peanut and herb stuffed triangular pastry', 10.00, true),
('ami-05', 'Somucha', 'Snacks', 'Golden fried minced filling wrapped in flaky dough', 10.00, true),
('ami-06', 'Puri', 'Snacks', 'Puffed deep-fried bread served warm', 10.00, true),
-- Amitie Lunch & Mains
('ami-07', 'Rice', 'Lunch & Dinner', 'Steamed aromatic white rice', 10.00, true),
('ami-08', 'Rui Fish', 'Lunch & Dinner', 'Pan-fried and slow-simmered Rui fish in spicy onion gravy', 80.00, true),
('ami-09', 'Egg Bhuna (Egg Curry)', 'Lunch & Dinner', 'Hard-boiled egg cooked in thick rich caramelized onion gravy', 25.00, true),
('ami-10', 'Bhorta (Mashed Dish)', 'Lunch & Dinner', 'Traditional mashed potato, eggplant, or mustard lentil paste', 15.00, true),
('ami-11', 'Broiler Chicken', 'Lunch & Dinner', 'Tender chicken curry cooked with fragrant spices and potatoes', 50.00, true),
('ami-12', 'Small Fish', 'Lunch & Dinner', 'Traditional spicy small fish (Kachki/Chanda) stir-fry', 30.00, true),
('ami-13', 'Khichuri', 'Lunch & Dinner', 'Wholesome rice and yellow lentil hotchpotch', 30.00, true),
('ami-14', 'Chicken Tehari', 'Lunch & Dinner', 'Aromatic mustard-infused rice cooked with tender spiced chicken pieces', 70.00, true),
('ami-15', 'Morog Polao (Chicken Pilaf)', 'Lunch & Dinner', 'Royal Chinigura rice pilaf with tender slow-cooked country chicken', 130.00, true),
('ami-16', 'Egg Polao (Egg Pilaf)', 'Lunch & Dinner', 'Fragrant Chinigura rice pilaf served with a spiced roasted egg', 60.00, true),
-- Amitie Fast Food & Savory
('ami-17', 'Sandwich', 'Fast Food', 'Fresh toasted bread with creamy shredded chicken and coleslaw', 60.00, true),
('ami-18', 'Chicken Shawarma', 'Fast Food', 'Grilled marinated chicken wrap with garlic mayo and pickles', 50.00, true),
('ami-19', 'Meatbox', 'Fast Food', 'Loaded potato fries layered with shredded chicken, sausage, and signature sauce', 100.00, true),
('ami-20', 'Chicken Ball', 'Fast Food', 'Crispy seasoned chicken balls served with sweet chili sauce', 25.00, true),
('ami-21', 'Vegetable Roll', 'Snacks', 'Crispy breadcrumb-coated roll stuffed with spiced mixed vegetables', 20.00, true),
('ami-22', 'Spicy Patty', 'Snacks', 'Golden flaky puff pastry filled with spiced minced chicken', 20.00, true),
('ami-23', 'Tikka Burger', 'Fast Food', 'Toasted bun loaded with charcoal-grilled chicken tikka patty and mayo', 50.00, true),
('ami-24', 'Chhola (Chickpeas)', 'Snacks', 'Spiced boiled chickpeas tossed with chili, onions, and lemon', 15.00, true),
('ami-25', 'Pizza', 'Fast Food', 'Personal pizza slice topped with marinara, capsicum, and mozzarella', 30.00, true),
('ami-26', 'Wedges', 'Fast Food', 'Golden crispy seasoned potato wedges with garlic dip', 30.00, true),
('ami-27', 'Potato Chop', 'Snacks', 'Spiced mashed potato cutlet dipped in chickpea batter and deep-fried', 20.00, true),
('ami-28', 'Slice Cake', 'Bakery', 'Moist vanilla and marble sponge cake slice', 10.00, true),
('ami-29', 'Butter Bun', 'Bakery', 'Freshly baked soft sweet bun filled with cream butter', 10.00, true),
-- Dubbing Drinks Corner (Amitie)
('dub-01', 'Borhani', 'Beverages', 'Traditional refreshing yogurt digestif with mint, coriander, and black salt', 35.00, true),
('dub-02', 'Cold Coffee', 'Beverages', 'Thick creamy blended cold coffee with choco drizzle', 40.00, true),
('dub-03', 'Hot Coffee', 'Beverages', 'Fresh brewed hot milk coffee', 20.00, true),
('dub-04', 'Lacchi (Sweet Lassi)', 'Beverages', 'Chilled churned sweet yogurt drink topped with crushed nuts', 35.00, true),
('dub-05', 'Lemonade (Lebur Shorbot)', 'Beverages', 'Fresh squeezed Kagoji lemon cooler with mint and rock salt', 20.00, true),
('dub-06', 'Dudh Cha (Milk Tea)', 'Beverages', 'Cardamom-infused strong brewed campus milk tea', 10.00, true),
-- Vista Cafe Specials
('vis-01', 'Crispy Chicken Sub', 'Fast Food', 'Submarine bun with crispy chicken tender, lettuce, and honey mustard', 120.00, true),
('vis-02', 'Beef Kebab Roll', 'Fast Food', 'Tender spiced beef seekh kebab wrapped in handmade paratha', 90.00, true),
('vis-03', 'Cappuccino', 'Beverages', 'Italian espresso with steamed milk foam and cocoa powder', 80.00, true),
('vis-04', 'Chocolate Brownie', 'Bakery', 'Fudgy Dutch cocoa brownie with molten center', 60.00, true),
-- Pitstop Specials
('pit-01', 'Chicken Cheese Burger', 'Fast Food', 'Juicy grilled chicken patty topped with melted cheddar and caramelized onions', 90.00, true),
('pit-02', 'Spicy Fried Chicken (2pcs)', 'Fast Food', 'Crispy buttermilk battered chicken drumstick and thigh', 110.00, true),
('pit-03', 'French Fries Large', 'Fast Food', 'Golden crinkle-cut fries seasoned with peri-peri salt', 50.00, true),
('pit-04', 'Oreo Milkshake', 'Beverages', 'Thick chilled shake with vanilla ice cream and crushed Oreos', 75.00, true),
-- Third Place (Monpura) Breakfast
('item-thp-bf-1', 'Paratha', 'Breakfast', 'Freshly rolled crispy layered flatbread, hot from the tawa', 10.00, true),
('item-thp-bf-2', 'Dal-Bhaji', 'Breakfast', 'Homestyle tempered yellow lentils with seasonal mixed vegetable bhaji', 10.00, true),
('item-thp-bf-3', 'Egg Omelet', 'Breakfast', 'Pan-fried farm fresh egg with chopped onions, green chilies, and coriander', 18.00, true),
('item-thp-bf-4', 'Bhorta-Bhaji Rice (Mixed Bhorta)', 'Breakfast', 'Steamed rice platter served with assorted traditional Bengali bhortas and vegetable bhaji', 50.00, true),
('item-thp-bf-5', 'Egg Khichuri', 'Breakfast', 'Comforting spiced rice and lentil hotchpotch served with a seasoned fried egg', 50.00, true),
('item-thp-bf-6', 'Chicken Khichuri', 'Breakfast', 'Aromatic khichuri prepared with mustard oil, aromatic spices, and tender chicken pieces', 70.00, true),
('item-thp-bf-7', 'Chhola', 'Breakfast', 'Spiced chickpeas sauteed with ginger, cumin, green chilies, and mustard seeds', 15.00, true),
-- Third Place (Monpura) Lunch
('item-thp-ln-1', 'Plain Rice', 'Lunch', 'Steamed hot white aromatic rice', 10.00, true),
('item-thp-ln-2', 'Plain Rice + Beef + Dal', 'Lunch', 'Full student meal combo: Steamed plain rice served with spicy beef curry and warm dal', 150.00, true),
('item-thp-ln-3', 'Chicken Curry', 'Lunch', 'Traditional Bengali style chicken curry cooked with potatoes in rich onion gravy', 50.00, true),
('item-thp-ln-4', 'Egg Bhuna', 'Lunch', 'Boiled egg simmered in caramelized onion, garlic, and rich tomato-cumin masala', 25.00, true),
('item-thp-ln-5', 'Morog Polao', 'Lunch', 'Fragrant Chinigura rice pilaf cooked with ghee, whole spices, and succulent quarter chicken', 150.00, true),
('item-thp-ln-6', 'Fried Rice + Chili Chicken', 'Lunch', 'Wok-tossed egg fried rice paired with Indo-Chinese style boneless spicy chili chicken', 150.00, true),
('item-thp-ln-7', 'Chicken Fry', 'Lunch', 'Crispy skin deep-fried chicken marinated in crushed ginger, garlic, and Bengali spices', 70.00, true),
('item-thp-ln-8', 'Jhalalo Tehari (Broiler)', 'Lunch', 'Spicy mustard-infused Chinigura rice cooked with tender pieces of broiler chicken', 70.00, true),
('item-thp-ln-9', 'Beef Tehari', 'Lunch', 'Authentic Old Dhaka style mustard oil tehari packed with spiced tender beef cubes', 140.00, true),
('item-thp-ln-10', 'Rui Fish', 'Lunch', 'Freshly caught Rui fish cutlet shallow-fried and simmered in spicy onion-tomato gravy', 60.00, true),
('item-thp-ln-11', 'Mixed Bhorta', 'Lunch', 'Trio of mashed delicacies: Aloo bhorta, Begun bhorta, and spicy Dal bhorta with mustard oil', 25.00, true),
-- Third Place (Monpura) Tea Break / Snacks
('item-thp-sn-1', 'Chotpoti', 'Tea Break / Snacks', 'Tangy yellow pea soup loaded with diced boiled egg, crushed processing, tamarind sauce, and green chilies', 30.00, true),
('item-thp-sn-2', 'Bhel Puri', 'Tea Break / Snacks', 'Crispy puffed rice tossed with peanuts, sev, diced potatoes, onions, and sweet tamarind chutney', 25.00, true),
('item-thp-sn-3', 'Khude Singara', 'Tea Break / Snacks', 'Bite-sized mini crispy pastry stuffed with spiced potato and peanuts. Perfect with afternoon tea', 3.00, true),
('item-thp-sn-4', 'Boishakhi Moricher Singara', 'Tea Break / Snacks', 'Spicy Bengali singara packed with extra roasted green chili punch and savory potato masala', 10.00, true),
('item-thp-sn-5', 'Junior Burger', 'Tea Break / Snacks', 'Compact toasted bun with a tender chicken patty, fresh cucumber, and signature house mayo', 50.00, true),
('item-thp-sn-6', 'Burger', 'Tea Break / Snacks', 'Full-sized grilled chicken burger with lettuce, sliced tomatoes, caramelized onions, and savory dressing', 80.00, true),
('item-thp-sn-7', 'Sandwich', 'Tea Break / Snacks', 'Toasted sliced bread filled with creamy shredded chicken and pepper mayo', 35.00, true),
('item-thp-sn-8', 'Dal Puri', 'Tea Break / Snacks', 'Deep-fried puffed pastry stuffed with savory spiced yellow lentil paste', 5.00, true),
('item-thp-sn-9', 'Aloo Puri', 'Tea Break / Snacks', 'Warm puffed puri with seasoned mashed potato stuffing', 5.00, true),
('item-thp-sn-10', 'French Fry', 'Tea Break / Snacks', 'Golden fried potato batons served with tangy ketchup and chili flake dip', 30.00, true),
('item-thp-sn-11', 'Wedges', 'Tea Break / Snacks', 'Seasoned rustic potato wedges with paprika crust and garlic dipping sauce', 30.00, true),
('item-thp-sn-12', 'Chicken Lollipop', 'Tea Break / Snacks', 'Frenched chicken winglet coated in spicy red batter and fried to perfection', 30.00, true),
('item-thp-sn-13', 'Chicken Wings', 'Tea Break / Snacks', 'Crispy spiced chicken wing glazed with savory chili sauce', 30.00, true),
-- Third Place (Monpura) Ice Cream
('item-thp-ic-1', 'Carnival Hazelnut Cone', 'Ice Cream', 'Premium crispy waffle cone with rich roasted hazelnut chocolate ice cream and crunchy nut toppings', 70.00, true),
('item-thp-ic-2', 'Carnival Butterscotch Cone', 'Ice Cream', 'Crispy waffle cone filled with creamy butterscotch ice cream and caramel drizzle', 60.00, true),
('item-thp-ic-3', 'Chocolate Cone', 'Ice Cream', 'Classic chocolate ice cream scoop nestled in a sweet waffle cone topped with chocolate chips', 60.00, true),
('item-thp-ic-4', 'Bebozzo', 'Ice Cream', 'Deluxe layered chocolate bar ice cream with thick Belgian chocolate shell and cream swirl', 100.00, true),
('item-thp-ic-5', 'Rups/Classic', 'Ice Cream', 'Rich traditional creamy ice cream cup with authentic dairy vanilla and fruit ribbon', 70.00, true),
('item-thp-ic-6', 'Chocobar', 'Ice Cream', 'Classic vanilla cream stick bar dipped in rich crunchy chocolate coating', 40.00, true)
ON CONFLICT (item_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. OFFERS Relationship (CAFETERIA <-> MENU_ITEM)
-- ----------------------------------------------------------------------------
-- Amitie offers all ami-* and dub-* items
INSERT INTO cafeteria_offers_item (cafeteria_id, item_id)
SELECT 'amitie', item_id FROM menu_items WHERE item_id LIKE 'ami-%' OR item_id LIKE 'dub-%'
ON CONFLICT (cafeteria_id, item_id) DO NOTHING;

-- Vista Cafe offers vis-*, select breakfast & beverages
INSERT INTO cafeteria_offers_item (cafeteria_id, item_id)
SELECT 'vista', item_id FROM menu_items WHERE item_id LIKE 'vis-%' OR item_id IN ('ami-01', 'ami-02', 'ami-03', 'dub-02', 'dub-03')
ON CONFLICT (cafeteria_id, item_id) DO NOTHING;

-- Pitstop offers pit-* and select fast food
INSERT INTO cafeteria_offers_item (cafeteria_id, item_id)
SELECT 'pitstop', item_id FROM menu_items WHERE item_id LIKE 'pit-%' OR item_id IN ('ami-17', 'ami-18', 'ami-19', 'ami-20')
ON CONFLICT (cafeteria_id, item_id) DO NOTHING;

-- Third Place (Monpura) offers all item-thp-* items
INSERT INTO cafeteria_offers_item (cafeteria_id, item_id)
SELECT 'monpura', item_id FROM menu_items WHERE item_id LIKE 'item-thp-%'
ON CONFLICT (cafeteria_id, item_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. STOCKS Relationship with attributes (quantity, low_stock_threshold)
-- ----------------------------------------------------------------------------
INSERT INTO cafeteria_stocks_item (cafeteria_id, item_id, quantity, low_stock_threshold) VALUES
('amitie', 'ami-01', 120, 20),
('amitie', 'ami-02', 80, 15),
('amitie', 'ami-03', 75, 15),
('amitie', 'ami-04', 150, 30),
('amitie', 'ami-05', 100, 25),
('amitie', 'ami-06', 90, 20),
('amitie', 'ami-07', 200, 30),
('amitie', 'ami-08', 45, 10),
('amitie', 'ami-09', 60, 15),
('amitie', 'ami-10', 50, 10),
('amitie', 'ami-11', 85, 15),
('amitie', 'ami-12', 40, 10),
('amitie', 'ami-13', 95, 20),
('amitie', 'ami-14', 110, 25),
('amitie', 'ami-15', 70, 15),
('amitie', 'ami-16', 55, 12),
('amitie', 'ami-17', 60, 15),
('amitie', 'ami-18', 80, 20),
('amitie', 'ami-19', 45, 10),
('amitie', 'ami-20', 100, 25),
('amitie', 'ami-21', 60, 15),
('amitie', 'ami-22', 70, 15),
('amitie', 'ami-23', 50, 12),
('amitie', 'ami-24', 40, 10),
('amitie', 'ami-25', 65, 15),
('amitie', 'ami-26', 80, 20),
('amitie', 'ami-27', 90, 20),
('amitie', 'ami-28', 50, 10),
('amitie', 'ami-29', 60, 15),
('amitie', 'dub-01', 90, 20),
('amitie', 'dub-02', 110, 25),
('amitie', 'dub-03', 150, 30),
('amitie', 'dub-04', 75, 15),
('amitie', 'dub-05', 85, 20),
('amitie', 'dub-06', 300, 50),
('vista', 'vis-01', 45, 10),
('vista', 'vis-02', 50, 12),
('vista', 'vis-03', 80, 20),
('vista', 'vis-04', 35, 8),
('pitstop', 'pit-01', 70, 15),
('pitstop', 'pit-02', 60, 15),
('pitstop', 'pit-03', 120, 25),
('pitstop', 'pit-04', 65, 15)
ON CONFLICT (cafeteria_id, item_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. USER Entity (Superclass for ISA hierarchy)
-- ----------------------------------------------------------------------------
INSERT INTO users (user_id, name, email, password_hash, phone, user_type) VALUES
('USR-STU-001', 'Sarah Rahman', 'student@bup.edu.bd', '$2a$10$7rXmB8V9bE9tS3.8R9K3QeqM2Z0o1h8E5w6s9n1v3y8p0q2r4t6u8', '+8801711000001', 'student'),
('USR-FAC-001', 'Dr. Tanvir Ahmed', 'faculty@bup.edu.bd', '$2a$10$7rXmB8V9bE9tS3.8R9K3QeqM2Z0o1h8E5w6s9n1v3y8p0q2r4t6u8', '+8801711000002', 'faculty'),
('USR-OFF-001', 'Mohammad Rafiqul Islam', 'officer@bup.edu.bd', '$2a$10$7rXmB8V9bE9tS3.8R9K3QeqM2Z0o1h8E5w6s9n1v3y8p0q2r4t6u8', '+8801711000003', 'officer'),
('USR-STF-001', 'Rahim Mia', 'staff@bup.edu.bd', '$2a$10$7rXmB8V9bE9tS3.8R9K3QeqM2Z0o1h8E5w6s9n1v3y8p0q2r4t6u8', '+8801711000004', 'staff'),
('USR-GST-001', 'Kamal Uddin (Guest)', 'guest@bup.edu.bd', '$2a$10$7rXmB8V9bE9tS3.8R9K3QeqM2Z0o1h8E5w6s9n1v3y8p0q2r4t6u8', '+8801811000005', 'guest')
ON CONFLICT (user_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. STUDENT Subclass (ISA USER)
-- ----------------------------------------------------------------------------
INSERT INTO students (student_id, department, batch) VALUES
('USR-STU-001', 'Computer Science & Engineering (CSE)', '2021')
ON CONFLICT (student_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. FACULTY Subclass (ISA USER)
-- ----------------------------------------------------------------------------
INSERT INTO faculties (faculty_id, department, designation) VALUES
('USR-FAC-001', 'Business Administration (BBA)', 'Assistant Professor')
ON CONFLICT (faculty_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 10. OFFICER Subclass (ISA USER)
-- ----------------------------------------------------------------------------
INSERT INTO officers (officer_id, rank, office) VALUES
('USR-OFF-001', 'Senior Section Officer', 'Registrar Office')
ON CONFLICT (officer_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 11. STAFF Subclass (ISA USER)
-- ----------------------------------------------------------------------------
INSERT INTO staffs (staff_id, section) VALUES
('USR-STF-001', 'Cafeteria Kitchen Operations')
ON CONFLICT (staff_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 12. GUEST Subclass (ISA USER)
-- ----------------------------------------------------------------------------
INSERT INTO guests (guest_code, valid_until) VALUES
('USR-GST-001', '2026-12-31 23:59:59+06')
ON CONFLICT (guest_code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 13. ORDER Entity
-- ----------------------------------------------------------------------------
INSERT INTO orders (order_id, user_id, cafeteria_id, order_time, status, total_amount, pickup_token, qr_code, expires_at) VALUES
('ORD-2026-001', 'USR-STU-001', 'amitie', '2026-10-08 12:30:00+06', 'ready', 105.00, 'TK-8421', 'SBCMS-ORD-2026-001-TOKEN-8421', '2026-10-08 13:00:00+06'),
('ORD-2026-002', 'USR-FAC-001', 'vista', '2026-10-08 13:15:00+06', 'completed', 200.00, 'TK-3912', 'SBCMS-ORD-2026-002-TOKEN-3912', '2026-10-08 13:45:00+06'),
('ORD-2026-003', 'USR-OFF-001', 'amitie', '2026-10-08 13:45:00+06', 'preparing', 140.00, 'TK-6519', 'SBCMS-ORD-2026-003-TOKEN-6519', '2026-10-08 14:15:00+06')
ON CONFLICT (order_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 14. ORDER_ITEM Weak Entity
-- ----------------------------------------------------------------------------
INSERT INTO order_items (order_id, item_id, quantity, unit_price) VALUES
('ORD-2026-001', 'ami-14', 1, 70.00),
('ORD-2026-001', 'dub-01', 1, 35.00),
('ORD-2026-002', 'vis-01', 1, 120.00),
('ORD-2026-002', 'vis-03', 1, 80.00),
('ORD-2026-003', 'ami-15', 1, 130.00),
('ORD-2026-003', 'dub-06', 1, 10.00)
ON CONFLICT (order_id, item_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 15. PAYMENT Entity
-- ----------------------------------------------------------------------------
INSERT INTO payments (payment_id, order_id, method, amount, txn_ref, status, paid_at) VALUES
('PAY-901', 'ORD-2026-001', 'bkash', 105.00, 'BKASH-TXN-9021-X1', 'completed', '2026-10-08 12:31:00+06'),
('PAY-902', 'ORD-2026-002', 'nagad', 200.00, 'NAGAD-TXN-8834-Y2', 'completed', '2026-10-08 13:16:00+06'),
('PAY-903', 'ORD-2026-003', 'cash', 140.00, 'CASH-COUNTER-03', 'completed', '2026-10-08 13:46:00+06')
ON CONFLICT (payment_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 16. REVIEW Entity
-- ----------------------------------------------------------------------------
INSERT INTO reviews (review_id, user_id, item_id, rating, comment, review_date) VALUES
('REV-101', 'USR-STU-001', 'ami-14', 5, 'Best Tehari on campus! Spiced just right and generous chicken portions.', '2026-10-08 13:30:00+06'),
('REV-102', 'USR-FAC-001', 'vis-01', 5, 'Crispy chicken sub at Vista Cafe is excellent for quick faculty lunch breaks.', '2026-10-08 14:00:00+06'),
('REV-103', 'USR-OFF-001', 'ami-15', 5, 'Morog Polao was fresh and fragrant. Highly recommended!', '2026-10-08 14:20:00+06'),
('REV-104', 'USR-STU-001', 'dub-01', 4, 'Borhani was great and chilled. Perfect with biryani.', '2026-10-08 13:35:00+06')
ON CONFLICT (review_id) DO NOTHING;
