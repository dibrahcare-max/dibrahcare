-- جدول تسجيل زيارات الصفحات
create table if not exists page_visits (
  id bigserial primary key,
  page text not null,           -- 'home' | 'services' | 'register' | ...
  visitor_hash text,             -- hash للـ IP + user agent (لتتبع الفريد)
  created_at timestamptz default now()
);

-- Indexes لسرعة الاستعلام
create index if not exists idx_page_visits_page on page_visits(page);
create index if not exists idx_page_visits_created_at on page_visits(created_at);
create index if not exists idx_page_visits_visitor_hash on page_visits(visitor_hash);
