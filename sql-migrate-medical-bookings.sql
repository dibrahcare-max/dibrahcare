-- ════════════════════════════════════════════════════════════════════
--  ترحيل الحجوزات الطبية إلى service_type = 'medical'
--  هدفه: الحجوزات القديمة اللي خُزّنت بـ service_type خاطئ
--  (مثلاً 'other' أو NULL) ترجع لـ 'medical' عشان تظهر في
--  /admindibrah/medical تحت تبويب "🏥 الحجوزات".
--
--  الطريقة: نتعرّف على الحجز الطبي من حقل notes (JSON)
--  حيث service_key = 'medical' أو من package_id يبدأ بـ medical_
-- ════════════════════════════════════════════════════════════════════

-- ─── 1) التشخيص قبل الترحيل ───
--     يعرض كم حجز فيه إشارة طبية لكنه مخزّن بـ service_type غير صحيح
SELECT
  COUNT(*) AS total_medical_bookings_misaligned,
  service_type AS current_service_type
FROM bookings
WHERE
  (
    notes::jsonb ->> 'service_key' = 'medical'
    OR (notes::jsonb ->> 'package_id') LIKE 'medical_%'
    OR package_id LIKE 'medical_%'
  )
  AND COALESCE(service_type, '') <> 'medical'
GROUP BY service_type;

-- ─── 2) عرض البيانات قبل التحديث (للتأكد) ───
SELECT
  id,
  service_type,
  package_id,
  payment_status,
  notes::jsonb ->> 'service_key'   AS notes_service_key,
  notes::jsonb ->> 'package_label' AS notes_package_label,
  created_at
FROM bookings
WHERE
  (
    notes::jsonb ->> 'service_key' = 'medical'
    OR (notes::jsonb ->> 'package_id') LIKE 'medical_%'
    OR package_id LIKE 'medical_%'
  )
  AND COALESCE(service_type, '') <> 'medical'
ORDER BY created_at DESC;

-- ────────────────────────────────────────────────────────────────────
--  ⚠️  راجع نتائج الاستعلام السابق قبل التنفيذ التالي
-- ────────────────────────────────────────────────────────────────────

-- ─── 3) التنفيذ — تحديث service_type ───
--     آمن: لا يلمس الحجوزات اللي service_type='medical' أصلاً
UPDATE bookings
SET service_type = 'medical'
WHERE
  (
    notes::jsonb ->> 'service_key' = 'medical'
    OR (notes::jsonb ->> 'package_id') LIKE 'medical_%'
    OR package_id LIKE 'medical_%'
  )
  AND COALESCE(service_type, '') <> 'medical';

-- ─── 4) التحقق بعد الترحيل ───
SELECT
  service_type,
  COUNT(*) AS count
FROM bookings
GROUP BY service_type
ORDER BY count DESC;

-- ════════════════════════════════════════════════════════════════════
--  ملاحظة عن الحجوزات المستقبلية:
--    لا حاجة لأي تحديث للكود — تدفّق /book/medical يخزّن service_type='medical'
--    تلقائياً عبر /api/save-booking (تأكدنا من ذلك في الكود).
-- ════════════════════════════════════════════════════════════════════
