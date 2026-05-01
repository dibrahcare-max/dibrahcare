-- ═══════════════════════════════════════════════════════════════
-- دمج العملاء المكررين (نفس رقم الجوال) في صف واحد
-- ═══════════════════════════════════════════════════════════════
-- المنطق:
-- 1. لكل رقم جوال مكرر، نختار الصف الأقدم كـ "الأصلي"
-- 2. نحوّل كل registrations و bookings المرتبطة بالصفوف المكررة
--    لتشير للصف الأصلي
-- 3. نحذف الصفوف المكررة من customers
-- 4. نضيف قيد UNIQUE على phone لمنع التكرار مستقبلاً
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ═══ الخطوة 1: جدول مؤقت بخريطة (الأصلي → المكرر) ═══
CREATE TEMP TABLE customer_merge_map AS
WITH ranked AS (
  SELECT
    id,
    phone,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) AS rn,
    FIRST_VALUE(id) OVER (PARTITION BY phone ORDER BY created_at ASC) AS keeper_id
  FROM customers
  WHERE phone IS NOT NULL AND phone != ''
)
SELECT id AS dup_id, keeper_id, phone
FROM ranked
WHERE rn > 1;

-- عرض للتأكد
SELECT COUNT(*) AS duplicates_to_merge FROM customer_merge_map;

-- ═══ الخطوة 2: تحويل registrations من المكرر للأصلي ═══
UPDATE registrations r
SET customer_id = m.keeper_id
FROM customer_merge_map m
WHERE r.customer_id = m.dup_id;

-- ═══ الخطوة 3: تحويل bookings من المكرر للأصلي ═══
UPDATE bookings b
SET customer_id = m.keeper_id
FROM customer_merge_map m
WHERE b.customer_id = m.dup_id;

-- ═══ الخطوة 4: حذف الصفوف المكررة من customers ═══
DELETE FROM customers c
USING customer_merge_map m
WHERE c.id = m.dup_id;

-- ═══ الخطوة 5: إصلاح registrations اللي customer_id فيها NULL ═══
-- نربطها بالعميل المناسب حسب subscriber_phone
UPDATE registrations r
SET customer_id = c.id
FROM customers c
WHERE r.customer_id IS NULL
  AND r.subscriber_phone = c.phone;

-- ═══ الخطوة 6: قيد UNIQUE على phone (يمنع التكرار مستقبلاً) ═══
ALTER TABLE customers
ADD CONSTRAINT customers_phone_unique UNIQUE (phone);

COMMIT;

-- ═══ التحقق ═══
-- يجب أن يرجع 0 (لا مكررات)
SELECT phone, COUNT(*) AS cnt
FROM customers
GROUP BY phone
HAVING COUNT(*) > 1;
