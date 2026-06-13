-- ═══ ربط التسجيلات بالعملاء ═══
-- شغّل هذا في Supabase SQL Editor

-- إضافة customer_id للتسجيلات الموجودة
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- فهرس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_registrations_customer_id ON registrations(customer_id);
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(subscriber_phone);

-- ربط التسجيلات القديمة بالعملاء حسب رقم الجوال
UPDATE registrations r
SET customer_id = c.id
FROM customers c
WHERE r.customer_id IS NULL
  AND r.subscriber_phone = c.phone;

-- التحقق
SELECT
  (SELECT COUNT(*) FROM registrations WHERE customer_id IS NOT NULL) AS linked,
  (SELECT COUNT(*) FROM registrations WHERE customer_id IS NULL) AS unlinked;
