-- جدول تقييمات الخدمة
create table if not exists feedback (
  id bigserial primary key,
  booking_id text,
  customer_name text,
  customer_phone text,

  -- التقييمات (1-5 نجوم)
  rating_overall int,
  rating_caregiver int,
  rating_punctuality int,
  rating_professionalism int,
  rating_cleanliness int,
  rating_communication int,

  -- اختيارات
  would_recommend text,        -- 'yes' | 'maybe' | 'no'
  would_rebook text,           -- 'yes' | 'maybe' | 'no'

  -- تعليق حر
  positive_feedback text,
  improvement_feedback text,
  additional_comments text,

  created_at timestamptz default now()
);

create index if not exists idx_feedback_booking on feedback(booking_id);
create index if not exists idx_feedback_phone on feedback(customer_phone);
create index if not exists idx_feedback_created on feedback(created_at);
