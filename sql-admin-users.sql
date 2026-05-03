-- ═══════════════════════════════════════════════════════════════
-- إنشاء جدول حسابات الموظفين للوحة التحكم
-- (يستخدم اسم مستخدم username بدل البريد)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name          text NOT NULL,
  active        boolean DEFAULT true,
  last_login    timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- تعطيل RLS (السيرفر فقط يستخدم service_role)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
