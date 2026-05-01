-- جدول رموز OTP المؤقتة
-- شغّل هذا في Supabase SQL Editor

CREATE TABLE IF NOT EXISTS otp_codes (
  phone        TEXT PRIMARY KEY,
  code         TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  attempts     INT  DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- فهرس لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

-- حذف الرموز المنتهية تلقائياً (اختياري - يحتاج cron)
-- DELETE FROM otp_codes WHERE expires_at < now();
