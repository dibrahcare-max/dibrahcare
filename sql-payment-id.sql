-- إضافة عمود الرقم المرجعي من بوابة الدفع (Neoleap)
-- يستخدم للمراجعة مع البنك عند أي خلاف أو استرداد
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- فهرس للبحث السريع بالرقم المرجعي (مفيد لو احتجت تبحث عن عملية معينة)
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON bookings(payment_id);
