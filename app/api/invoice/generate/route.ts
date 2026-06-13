import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsApp, sendWhatsAppDocument, notifyAdmins } from '@/lib/twilio'

export const runtime = 'nodejs'
export const maxDuration = 60

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// ═══ توليد رقم الفاتورة ═══
function generateInvoiceNumber(bookingId: string): string {
  const short = bookingId.split('-')[0].toUpperCase()
  const year = new Date().getFullYear()
  return `INV-${year}-${short}`
}

// ═══ تحويل الأرقام إلى عربي ═══
function toArabicNumerals(n: string | number): string {
  return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)])
}

// ═══ تنسيق التاريخ ═══
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dateStr
  }
}

// ═══ HTML الفاتورة ═══
function buildInvoiceHTML(data: {
  invoiceNumber: string
  invoiceDate: string
  bookingId: string
  customerName: string
  customerPhone: string
  customerVatNumber?: string
  serviceTitle: string
  packageLabel: string
  startDate: string
  amount: number
  subtotal: number
  vatAmount: number
  total: number
}): string {
  const logoUrl = 'https://dibrahcare.com/images/dibrah-logo.png'

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Tajawal', Arial, sans-serif; direction: rtl; background: #fff; color: #333; width: 794px; }
  .header { background: #5f6157; padding: 28px 36px 20px; display: flex; justify-content: space-between; align-items: center; }
  .logo { height: 52px; object-fit: contain; filter: brightness(0) invert(1); }
  .inv-title { color: #fff; font-size: 22px; font-weight: 700; text-align: left; direction: ltr; }
  .inv-num { color: #b8c2ad; font-size: 13px; margin-top: 4px; text-align: left; direction: ltr; }
  .stamp { display: inline-block; border: 2px solid #e2ecd3; border-radius: 50%; padding: 6px 12px; font-size: 11px; color: #e2ecd3; font-weight: 700; transform: rotate(-15deg); opacity: 0.85; margin-top: 6px; }
  .green-bar { background: #e2ecd3; padding: 10px 36px; display: flex; justify-content: space-between; }
  .green-bar span { font-size: 12px; color: #5f6157; font-weight: 500; }
  .body { padding: 28px 36px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .info-box { background: #f8f9f6; border: 0.5px solid #d6dcd0; border-radius: 8px; padding: 14px 16px; }
  .info-box-title { font-size: 11px; color: #5f6157; font-weight: 700; margin-bottom: 10px; border-bottom: 1px solid #d6dcd0; padding-bottom: 6px; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
  .info-label { color: #888; }
  .info-val { font-weight: 500; color: #333; }
  .info-val-ltr { font-weight: 500; color: #333; direction: ltr; text-align: left; }
  .tax-badge { background: #f0f4ed; border: 0.5px solid #c2cdb8; border-radius: 4px; padding: 2px 6px; font-size: 11px; color: #5f6157; font-weight: 700; direction: ltr; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
  thead tr { background: #5f6157; }
  th { color: #e2ecd3; padding: 10px 12px; text-align: right; font-weight: 500; font-size: 12px; }
  th:last-child { text-align: left; direction: ltr; }
  td { padding: 10px 12px; border-bottom: 0.5px solid #e8ede3; text-align: right; }
  td:last-child { text-align: left; direction: ltr; }
  .totals-wrap { display: flex; justify-content: flex-start; margin-bottom: 20px; }
  .totals-box { background: #f8f9f6; border: 0.5px solid #d6dcd0; border-radius: 8px; padding: 14px 20px; min-width: 300px; }
  .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; gap: 40px; }
  .total-row.grand { font-size: 15px; font-weight: 700; color: #5f6157; border-top: 1.5px solid #5f6157; padding-top: 10px; margin-top: 4px; }
  .total-lbl { color: #666; }
  .total-val { font-weight: 500; direction: ltr; }
  .notes-box { background: #fffbeb; border: 0.5px solid #e8d97a; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; font-size: 12px; color: #6b5e10; line-height: 1.7; }
  .footer { background: #5f6157; padding: 14px 36px; display: flex; justify-content: space-between; align-items: center; }
  .footer-text { font-size: 11px; color: #b8c2ad; }
  .footer-tax { font-size: 11px; color: #e2ecd3; font-weight: 500; direction: ltr; }
</style>
</head>
<body>

<div class="header">
  <img src="${logoUrl}" class="logo" alt="دبرة">
  <div style="text-align:left;direction:ltr">
    <div class="inv-title">فاتورة ضريبية</div>
    <div class="inv-num">${data.invoiceNumber}</div>
    <div class="stamp">مدفوعة</div>
  </div>
</div>

<div class="green-bar">
  <span>تاريخ الإصدار: ${formatDate(data.invoiceDate)}</span>
  <span>رقم الحجز: DBR-${data.bookingId.split('-')[0].toUpperCase()}</span>
</div>

<div class="body">

  <div class="two-col">
    <div class="info-box">
      <div class="info-box-title">بيانات مقدم الخدمة</div>
      <div class="info-row"><span class="info-label">الاسم</span><span class="info-val">شركة دبرة العائلة</span></div>
      <div class="info-row"><span class="info-label">الرقم الضريبي</span><span class="tax-badge">313082686500003</span></div>
      <div class="info-row"><span class="info-label">العنوان</span><span class="info-val">الرياض، حي الملقا</span></div>
      <div class="info-row"><span class="info-label">الموقع</span><span class="info-val-ltr">dibrahcare.com</span></div>
    </div>
    <div class="info-box">
      <div class="info-box-title">بيانات العميل</div>
      <div class="info-row"><span class="info-label">الاسم</span><span class="info-val">${data.customerName}</span></div>
      <div class="info-row"><span class="info-label">الجوال</span><span class="info-val-ltr">${data.customerPhone}</span></div>
      ${data.customerVatNumber ? `<div class="info-row" style="margin-top:8px;padding-top:8px;border-top:0.5px dashed #d6dcd0"><span class="info-label">الرقم الضريبي</span><span class="tax-badge">${data.customerVatNumber}</span></div>` : ''}
    </div>
  </div>

  <div class="info-box" style="margin-bottom:16px">
    <div class="info-box-title">تفاصيل الخدمة</div>
    <div class="info-row"><span class="info-label">الخدمة</span><span class="info-val">${data.serviceTitle}</span></div>
    <div class="info-row"><span class="info-label">الباقة</span><span class="info-val">${data.packageLabel}</span></div>
    <div class="info-row"><span class="info-label">تاريخ البدء</span><span class="info-val">${formatDate(data.startDate)}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>الوصف</th>
        <th>سعر الوحدة</th>
        <th>المجموع</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="color:#888">١</td>
        <td>${data.serviceTitle} — ${data.packageLabel}</td>
        <td>${data.subtotal.toFixed(2)} ر.س</td>
        <td>${data.subtotal.toFixed(2)} ر.س</td>
      </tr>
    </tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals-box">
      <div class="total-row"><span class="total-lbl">المجموع قبل الضريبة</span><span class="total-val">${data.subtotal.toFixed(2)} ر.س</span></div>
      <div class="total-row"><span class="total-lbl">ضريبة القيمة المضافة (15%)</span><span class="total-val">${data.vatAmount.toFixed(2)} ر.س</span></div>
      <div class="total-row grand"><span class="total-lbl">الإجمالي المستحق</span><span class="total-val">${data.total.toFixed(2)} ر.س</span></div>
    </div>
  </div>

  <div class="notes-box">
    تم سداد المبلغ كاملاً عبر بوابة الدفع الإلكتروني. هذه الفاتورة مستوفية لمتطلبات الفوترة الإلكترونية وفق أنظمة هيئة الزكاة والضريبة والجمارك.
  </div>

</div>

<div class="footer">
  <span class="footer-text">طريق الملك فهد الفرعي، حي الملقا، الرياض 13521</span>
  <span class="footer-tax">VAT: 313082686500003</span>
</div>

</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json()
    if (!bookingId) {
      return NextResponse.json({ success: false, message: 'bookingId مطلوب' }, { status: 400 })
    }

    // ═══ جلب بيانات الحجز ═══
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingErr || !booking) {
      return NextResponse.json({ success: false, message: 'الحجز غير موجود' }, { status: 404 })
    }

    // ═══ جلب بيانات العميل ═══
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('full_name, phone, vat_number')
      .eq('id', booking.customer_id)
      .maybeSingle()

    // ═══ استخراج بيانات الحجز من notes ═══
    let notes: any = {}
    try { notes = JSON.parse(booking.notes || '{}') } catch {}

    const total = parseFloat(booking.amount || 0)
    const subtotal = parseFloat((total / 1.15).toFixed(2))
    const vatAmount = parseFloat((total - subtotal).toFixed(2))

    const invoiceData = {
      invoiceNumber: generateInvoiceNumber(bookingId),
      invoiceDate: new Date().toISOString().split('T')[0],
      bookingId,
      customerName: customer?.full_name || notes.full_name || '—',
      customerPhone: customer?.phone || notes.phone || '—',
      customerVatNumber: customer?.vat_number || undefined,
      serviceTitle: notes.service_key || booking.service_type || '—',
      packageLabel: notes.package_label || booking.package_id || '—',
      startDate: notes.start_date || '—',
      amount: total,
      subtotal,
      vatAmount,
      total,
    }

    // ═══ توليد الـ PDF ═══
    let pdfBuffer: Buffer

    try {
      const chromium = (await import('@sparticuz/chromium')).default
      const puppeteer = (await import('puppeteer-core')).default

      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
      })

      const page = await browser.newPage()
      await page.setContent(buildInvoiceHTML(invoiceData), { waitUntil: 'load' })
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      })
      await browser.close()
      pdfBuffer = Buffer.from(pdf)
    } catch (e: any) {
      console.error('❌ [invoice] PDF generation failed:', e?.message)
      return NextResponse.json({ success: false, message: 'فشل توليد الفاتورة: ' + e?.message }, { status: 500 })
    }

    // ═══ تحويل PDF إلى base64 لإرساله عبر واتساب ═══
    const pdfBase64 = pdfBuffer.toString('base64')
    const invoiceNumber = invoiceData.invoiceNumber
    const fileName = `${invoiceNumber}.pdf`

    // ═══ إرسال واتساب للعميل ═══
    const waSends: Promise<any>[] = []

    if (customer?.phone) {
      const firstName = (customer.full_name || '').trim().split(/\s+/)[0] || 'عميلنا الكريم'
      waSends.push(
        sendWhatsApp(
          customer.phone,
          `مرحباً ${firstName} 🌿\n\nنشكرك على ثقتك بدبرة.\nيسعدنا إرسال فاتورتك الضريبية رقم *${invoiceNumber}* للخدمة المقدمة.\n\nلأي استفسار تواصل معنا عبر الموقع: dibrahcare.com`,
          { document: pdfBase64, filename: fileName }
        )
      )
    }

    // ═══ إرسال واتساب للأدمن ═══
    const adminPhones = (process.env.ADMIN_WHATSAPP_NUMBERS || '').split(',').filter(Boolean)
    for (const adminPhone of adminPhones) {
      waSends.push(
        sendWhatsApp(adminPhone, `🧾 فاتورة ضريبية صدرت\n\nالعميل: ${invoiceData.customerName}\nالمبلغ: ${total.toFixed(2)} ر.س\nرقم الفاتورة: ${invoiceNumber}`)
          .then(() => sendWhatsAppDocument(adminPhone, pdfBase64, fileName, `فاتورة — ${invoiceNumber}`))
      )
    }

    await Promise.allSettled(waSends)

    return NextResponse.json({ success: true, invoiceNumber })
  } catch (e: any) {
    console.error('❌ [invoice] Exception:', e?.message)
    return NextResponse.json({ success: false, message: e?.message || 'خطأ' }, { status: 500 })
  }
}
