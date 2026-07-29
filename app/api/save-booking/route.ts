import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsApp, notifyAdmins, TEMPLATES } from '@/lib/twilio'
import { getServiceTitle, parseArabicTime } from '@/lib/services'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// خريطة الخدمات → نوع الحجز في DB
const SERVICE_CATEGORY_MAP: Record<string, string> = {
  medical:   'medical',
  childcare: 'child',
  elderly:   'elderly',
  // الباقي → other
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      customer_id,
      service_key,
      service_category,
      package_id,
      package_label,
      start_date,
      start_time,
      end_time,
      child_count,
      beneficiary_count,
      amount,
      service_details,
      trackId,
      paymentId,
      payment_status, // اختياري: 'paid' (افتراضي) أو 'awaiting_quote' للحجوزات الطبية
      // ─── معلومات كود الخصم ───
      discount_code_id,
      discount_code,
      discount_percent,
      subtotal,
      discount_amount,
      // ─── بيانات الإهداء ───
      is_gift,
      gift_recipient_phone,
      gift_message,
      // ─── الحجز اليدوي من لوحة التحكم ───
      manual,
      subscriber_name,
      subscriber_phone,
      subscriber_id,
      subscriber_nationality,
      subscriber_address,
      beneficiary_name,
      beneficiary_age,
      beneficiary_relation,
      emergency_phone,
      subscriber_email,
      subscriber_short_address,
      status: manualStatus,
    } = body

    // الحجز يُعتبر يدوياً لو صُرّح بذلك، أو لو ما فيه customer_id لكن فيه جوال مشترك
    const isManual = !!manual || (!customer_id && !!subscriber_phone)

    // ═══ تحديد العميل ═══
    // الحجز الأونلاين يرسل customer_id جاهز. الحجز اليدوي (manual) لا يرسله —
    // نبحث عن العميل بالجوال إن كان مسجّلاً، وإلا نحفظ الحجز ببياناته في notes.
    let resolvedCustomerId: string | null = customer_id || null
    if (!resolvedCustomerId) {
      if (isManual && subscriber_phone) {
        const rawPhone = String(subscriber_phone).trim()
        const intlPhone = rawPhone.replace(/^0/, '966')
        const nid = subscriber_id ? String(subscriber_id).trim() : ''

        // 1) ابحث عن عميل مطابق بالجوال أو الهوية (نربطه بدل ما ننشئ مكرر)
        const orConds = [`phone.eq.${rawPhone}`, `phone.eq.${intlPhone}`]
        if (nid) orConds.push(`national_id.eq.${nid}`)
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .or(orConds.join(','))
          .maybeSingle()

        if (existingCustomer?.id) {
          resolvedCustomerId = existingCustomer.id
        } else {
          // 2) عميل جديد — الأعمدة الإلزامية في customers لازم تتعبأ بصيغ صحيحة
          const fullName    = (subscriber_name || '').trim()
          const nationality = (subscriber_nationality || '').trim()
          const emergency   = emergency_phone ? String(emergency_phone).trim() : ''
          const email       = (subscriber_email || '').toLowerCase().trim()
          const shortAddr   = (subscriber_short_address || '').trim().toUpperCase()

          const vErr =
            !fullName ? 'اسم المشترك مطلوب' :
            !/^[12]\d{9}$/.test(nid) ? 'رقم الهوية: ١٠ أرقام تبدأ بـ ١ أو ٢' :
            !/^05\d{8}$/.test(rawPhone) ? 'رقم الجوال: ١٠ أرقام تبدأ بـ ٠٥' :
            !nationality ? 'الجنسية مطلوبة' :
            !/^05\d{8}$/.test(emergency) ? 'رقم الطوارئ: ١٠ أرقام تبدأ بـ ٠٥' :
            !/^[A-Z]{4}\d{4}$/.test(shortAddr) ? 'العنوان الوطني المختصر: ٤ حروف + ٤ أرقام (مثل RYAR4321)' :
            !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'صيغة الإيميل غير صحيحة' :
            null
          if (vErr) {
            return NextResponse.json({ success: false, message: 'لإضافة عميل جديد — ' + vErr }, { status: 400 })
          }

          const { data: newCustomer, error: custErr } = await supabase
            .from('customers')
            .insert({
              full_name: fullName,
              national_id: nid,
              phone: rawPhone,
              nationality,
              emergency_phone: emergency,
              short_address: shortAddr,
              email,
              street: (subscriber_address || '').trim() || null,
              city: 'الرياض',
              referral_source: 'حجز يدوي',
            })
            .select('id')
            .single()

          if (newCustomer?.id) {
            resolvedCustomerId = newCustomer.id
          } else if ((custErr as any)?.code === '23505') {
            // تعارض: مسجّل مسبقاً بجوال/هوية/إيميل — أعد البحث واربط
            const { data: dup } = await supabase
              .from('customers')
              .select('id')
              .or([...orConds, `email.eq.${email}`].join(','))
              .maybeSingle()
            if (dup?.id) {
              resolvedCustomerId = dup.id
            } else {
              return NextResponse.json({ success: false, message: 'العميل مسجّل مسبقاً ببيانات مختلفة (جوال/هوية/إيميل)' }, { status: 409 })
            }
          } else {
            console.error('[save-booking] فشل إنشاء عميل الحجز اليدوي:', custErr)
            return NextResponse.json({ success: false, message: 'تعذّر إنشاء بيانات العميل، تحقق من الصيغ' }, { status: 400 })
          }
        }
      } else {
        return NextResponse.json({ success: false, message: 'بيانات العميل ناقصة' }, { status: 400 })
      }
    }

    // ═══ حماية سريعة من التكرار (تقليل عدد المحاولات الفاشلة) ═══
    // الحماية الفعلية الضامنة هي UNIQUE constraint على bookings.track_id في قاعدة البيانات
    if (trackId) {
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('track_id', trackId)
        .maybeSingle()

      if (existingBooking?.id) {
        console.log(`ℹ️  [save-booking] Duplicate detected for trackId ${trackId} — skipping`)
        return NextResponse.json({ success: true, bookingId: existingBooking.id, duplicate: true })
      }
    }

    // قيمة service_type لازم تكون من القيم المسموحة في DB
    const serviceType = service_category || SERVICE_CATEGORY_MAP[service_key] || 'other'

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: resolvedCustomerId,
        service_type: serviceType,
        package_id: package_id || null,
        track_id: trackId || null,
        service_details: service_details || null,
        status: (isManual && manualStatus) ? manualStatus : 'pending', // اليدوي: حسب اختيار الموظفة | الأونلاين: قيد المراجعة
        payment_status: payment_status || 'paid',
        amount: amount || null,
        notes: JSON.stringify({
          service_key,
          package_label,
          start_date,
          start_time,
          end_time,
          child_count,
          beneficiary_count,
          trackId,
          paymentId,
          // ─── معلومات الخصم في الملاحظات ───
          discount_code: discount_code || null,
          discount_percent: discount_percent || null,
          subtotal: subtotal || null,
          discount_amount: discount_amount || null,
          // ─── معلومات الإهداء ───
          is_gift: !!is_gift,
          gift_recipient_phone: gift_recipient_phone || null,
          gift_message: gift_message || null,
          // ─── بيانات الحجز اليدوي (تُعرض في كرت الحجز) ───
          ...(isManual ? {
            manual: true,
            subscriber_name: subscriber_name || null,
            subscriber_phone: subscriber_phone || null,
            subscriber_id: subscriber_id || null,
            subscriber_nationality: subscriber_nationality || null,
            subscriber_address: subscriber_address || null,
            beneficiary_name: beneficiary_name || null,
            beneficiary_age: beneficiary_age || null,
            beneficiary_relation: beneficiary_relation || null,
            emergency_phone: emergency_phone || null,
          } : {}),
        }),
      })
      .select('id')
      .single()

    if (error) {
      // لو الخطأ بسبب تكرار track_id (race condition تم اكتشافه على مستوى DB) — تعامل معه كنجاح، لا كخطأ
      if (error.code === '23505' && trackId) {
        console.log(`ℹ️  [save-booking] DB-level duplicate caught for trackId ${trackId}`)
        const { data: existing } = await supabase
          .from('bookings')
          .select('id')
          .eq('track_id', trackId)
          .maybeSingle()
        return NextResponse.json({ success: true, bookingId: existing?.id, duplicate: true })
      }
      console.error('save-booking error:', error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    // ═══ استهلاك كود الخصم (إن وُجد) ═══
    if (discount_code_id && booking?.id) {
      try {
        // زِد عداد الاستخدام، وحدّث used_at ومعلومات الاستخدام
        // ملاحظة: نستخدم RPC أو استعلام آمن للأكواد الخاصة
        const { data: codeRow } = await supabase
          .from('discount_codes')
          .select('id, is_public, use_count')
          .eq('id', discount_code_id)
          .single()

        if (codeRow) {
          await supabase
            .from('discount_codes')
            .update({
              use_count: (codeRow.use_count || 0) + 1,
              // الكود الخاص → علّمه مستخدماً
              ...(codeRow.is_public ? {} : {
                used: true,
                used_at: new Date().toISOString(),
                used_by_customer_id: customer_id,
                used_for_booking_id: booking.id,
              }),
            })
            .eq('id', discount_code_id)
        }
      } catch (e) {
        // لا نُفشل الحجز بسبب فشل تحديث عداد الكود
        console.error('discount-code consume failed:', e)
      }
    }

    // ═══ اربط الحجز بالمحاولة في payment_attempts ═══
    if (trackId && booking?.id) {
      try {
        await supabase
          .from('payment_attempts')
          .update({
            booking_id: booking.id,
            updated_at: new Date().toISOString(),
          })
          .eq('track_id', trackId)
        console.log(`✅ [save-booking] Linked booking ${booking.id} to attempt ${trackId}`)
      } catch (linkErr: any) {
        console.error('⚠️  [save-booking] Link to attempt failed:', linkErr?.message)
      }
    }

    // ═══ اجلب بيانات العميل (نستخدمها في الإيميل والواتساب) ═══
    const { data: customer } = resolvedCustomerId
      ? await supabase
          .from('customers')
          .select('full_name, phone, email')
          .eq('id', resolvedCustomerId)
          .maybeSingle()
      : { data: null as any }

    // ═══ رسالة تأكيد الحجز عبر واتساب — fire-and-forget ═══
    // نقصّر الـ UUID للعرض (أول ٨ أحرف بحروف كبيرة، مع بادئة DBR-)
    const shortBookingId = `DBR-${booking.id.split('-')[0].toUpperCase()}`
    const isMedical = (service_category === 'medical') || (service_key === 'medical')

    // نجمع وعود إرسال الواتساب وننتظرها قبل الرد (يمنع قطعها في بيئة serverless)
    const waSends: Promise<any>[] = []

    // للحجز اليدوي: أرسل لجوال المشترك مباشرة (قد لا يوجد صف عميل مرتبط).
    // لا نرسل تأكيداً للحجوزات الملغاة.
    const waRecipientPhone = customer?.phone || (isManual ? subscriber_phone : null)
    const waRecipientName  = customer?.full_name || (isManual ? subscriber_name : null)
    if (waRecipientPhone && !(isManual && manualStatus === 'cancelled')) {
      const firstName = (waRecipientName || '').trim().split(/\s+/)[0] || 'عميلنا الكريم'
      // الطبية: رسالة المحامي القانونية (تبقى كما هي). العادية: رسالة الاستلام/المراجعة
      const customerMessage = isMedical
        ? TEMPLATES.medicalBookingRequest(firstName, shortBookingId)
        : TEMPLATES.bookingReceived(
            firstName,
            getServiceTitle(service_key, service_category),
            package_label || '—',
            start_date || '—',
            start_time || '',
            shortBookingId
          )

      waSends.push(
        sendWhatsApp(waRecipientPhone, customerMessage)
          .then(r => {
            if (!r.success) {
              console.warn('⚠️  [save-booking] customer WhatsApp failed:', r.error)
            } else {
              console.log('✅ [save-booking] customer WhatsApp sent:', r.sid)
            }
          })
          .catch(err => console.error('customer WhatsApp exception:', err?.message))
      )
    }

    // ═══ رسالة الإهداء عبر واتساب للمُهدى إليه — fire-and-forget ═══
    if (is_gift && gift_recipient_phone && gift_message) {
      const senderName = (customer?.full_name || '').trim().split(/\s+/).slice(0, 2).join(' ') || 'صديقك'
      waSends.push(
        sendWhatsApp(
          gift_recipient_phone,
          TEMPLATES.giftReceived(
            senderName,
            gift_message,
            package_label || '—',
            start_date || '—'
          )
        )
          .then(r => {
            if (!r.success) {
              console.warn('⚠️  [save-booking] gift WhatsApp failed:', r.error)
            } else {
              console.log('✅ [save-booking] gift WhatsApp sent:', r.sid)
            }
          })
          .catch(err => console.error('gift WhatsApp exception:', err?.message))
      )
    }

    // ═══ تنبيه الأدمن — fire-and-forget (طبية بصياغة مختلفة) ═══
    const adminMessage = isMedical
      ? TEMPLATES.adminNewMedicalRequest(
          customer?.full_name || '—',
          customer?.phone || '—',
          shortBookingId
        )
      : TEMPLATES.adminNewBooking(
          customer?.full_name || (isManual ? subscriber_name : '') || '—',
          customer?.phone || (isManual ? subscriber_phone : '') || '—',
          getServiceTitle(service_key, service_category),
          package_label || '—',
          (typeof amount === 'number' && amount > 0) ? amount : null,
          shortBookingId,
          start_date || '—',
          start_time || ''
        )

    waSends.push(
      Promise.resolve(notifyAdmins(adminMessage)).catch(err =>
        console.error('admin notify exception:', err?.message)
      )
    )

    // ═══ جدولة الرسائل التلقائية (تنبيه قبل النهاية + طلب التقييم) ═══
    // فقط للحجوزات اللي عندها end_time محدد (يستثني الطبي اللي ما له موعد ثابت)
    if (!isMedical && customer?.phone && start_date && end_time) {
      try {
        // تحويل end_time العربي ("7:00 مساءً") إلى صيغة 24 ساعة ("19:00")
        const end24 = parseArabicTime(end_time)
        const start24 = parseArabicTime(start_time) || start_time

        if (!end24) {
          console.warn('⚠️  [save-booking] تعذّر تحليل وقت النهاية، تم تخطّي الجدولة:', end_time)
          throw new Error('invalid end_time format')
        }

        // بناء وقت نهاية الموعد بتوقيت السعودية (UTC+3)
        const endDateTime = new Date(`${start_date}T${end24}:00+03:00`)

        // معالجة حالة تجاوز منتصف الليل (مثلاً البداية 22:00 والنهاية 02:00)
        if (start24 && end24 < start24) {
          endDateTime.setDate(endDateTime.getDate() + 1)
        }

        const fifteenMinBefore = new Date(endDateTime.getTime() - 15 * 60 * 1000)
        const fifteenMinAfter  = new Date(endDateTime.getTime() + 15 * 60 * 1000)

        const firstName = (customer.full_name || '').trim().split(/\s+/)[0] || 'عميلنا الكريم'
        const feedbackLink = `https://dibrahcare.com/feedback?bookingId=${booking.id}`

        const { error: schedErr } = await supabase
          .from('scheduled_messages')
          .insert([
            {
              booking_id: booking.id,
              phone: customer.phone,
              body: TEMPLATES.endingSoon(firstName),
              template: 'endingSoon',
              scheduled_for: fifteenMinBefore.toISOString(),
            },
            {
              booking_id: booking.id,
              phone: customer.phone,
              body: TEMPLATES.feedbackRequest(firstName, feedbackLink),
              template: 'feedbackRequest',
              scheduled_for: fifteenMinAfter.toISOString(),
            },
          ])

        if (schedErr) {
          console.error('⚠️  [save-booking] تعذر جدولة الرسائل:', schedErr.message)
        } else {
          console.log('✅ [save-booking] جُدولت رسالتان للحجز:', booking.id)
        }
      } catch (e: any) {
        console.error('⚠️  [save-booking] خطأ في حساب وقت الجدولة:', e?.message)
      }
    }

    // ═══ إيميل للأدمن (اختياري) ═══
    if (process.env.RESEND_API_KEY) {
      const adminEmail = process.env.ADMIN_EMAIL || 'CustomerService@dibrahcare.com'

      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'دِبرة <noreply@dibrahcare.com>',
          to: adminEmail,
          subject: `🎉 حجز جديد — ${customer?.full_name || 'عميل'}`,
          html: `
            <div dir="rtl" style="font-family:Arial;padding:24px;color:#5f6157">
              <h2 style="color:#5f6157">حجز جديد في دِبرة</h2>
              <p><strong>العميل:</strong> ${customer?.full_name || '—'}</p>
              <p><strong>الجوال:</strong> ${customer?.phone || '—'}</p>
              <p><strong>البريد:</strong> ${customer?.email || '—'}</p>
              <hr/>
              <p><strong>الخدمة:</strong> ${service_key}</p>
              <p><strong>الباقة:</strong> ${package_label || '—'}</p>
              <p><strong>تاريخ البدء:</strong> ${start_date || '—'}</p>
              <p><strong>المبلغ:</strong> ${amount} ريال</p>
              <p><strong>رقم الحجز:</strong> ${booking.id}</p>
              <p><strong>رقم الدفع:</strong> ${paymentId || trackId || '—'}</p>
              ${service_details ? `<hr/><pre style="background:#f7f6ee;padding:12px;border-radius:6px;font-size:.85rem;direction:rtl;text-align:right">${JSON.stringify(service_details, null, 2)}</pre>` : ''}
            </div>
          `,
        }),
      }).catch(err => console.error('admin email failed:', err))
    }

    // ننتظر اكتمال إرسال كل رسائل الواتساب قبل الرد (يضمن وصولها)
    await Promise.allSettled(waSends)

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
    })
  } catch (e: any) {
    console.error('save-booking error:', e?.message || e)
    return NextResponse.json({ success: false, message: e?.message || 'خطأ' }, { status: 500 })
  }
}
