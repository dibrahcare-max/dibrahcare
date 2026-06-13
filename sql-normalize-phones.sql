-- توحيد صيغة أرقام الجوال إلى الدولية (9665XXXXXXXX)
-- يحل مشكلة عدم تطابق الرقم بين جدول customers والـ session

-- 1. تحويل الأرقام اللي تبدأ بـ 05 إلى 9665
UPDATE customers
SET phone = '966' || substring(phone from 2)
WHERE phone LIKE '05%' AND length(phone) = 10;

-- 2. تحويل الأرقام اللي تبدأ بـ 5 (بدون 0) إلى 9665
UPDATE customers
SET phone = '966' || phone
WHERE phone LIKE '5%' AND length(phone) = 9;

-- نفس الشي لجدول registrations
UPDATE registrations
SET subscriber_phone = '966' || substring(subscriber_phone from 2)
WHERE subscriber_phone LIKE '05%' AND length(subscriber_phone) = 10;

UPDATE registrations
SET subscriber_phone = '966' || subscriber_phone
WHERE subscriber_phone LIKE '5%' AND length(subscriber_phone) = 9;

-- وكذلك أرقام الطوارئ
UPDATE registrations
SET emergency_phone = '966' || substring(emergency_phone from 2)
WHERE emergency_phone LIKE '05%' AND length(emergency_phone) = 10;

UPDATE registrations
SET emergency_phone = '966' || emergency_phone
WHERE emergency_phone LIKE '5%' AND length(emergency_phone) = 9;
