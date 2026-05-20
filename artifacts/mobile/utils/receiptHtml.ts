import type { Customer, Measurement, Order } from "@/context/DatabaseContext";

const STATUS_UR: Record<string, string> = {
  pending: "زیر التوا",
  "in-progress": "جاری ہے",
  completed: "مکمل",
  delivered: "ڈیلیور",
};

const COLLAR_UR: Record<string, string> = { collar: "کالر", bain: "بین" };
const GHERA_UR: Record<string, string> = { square: "چورس گھیرا", round: "گول گھیرا" };

function row(label: string, value: string | number, highlight = false): string {
  return `
    <tr>
      <td class="val${highlight ? " hl" : ""}">${value}</td>
      <td class="lbl">${label}</td>
    </tr>`;
}

function measRow(label: string, value: number | null | undefined): string {
  if (value == null) return "";
  return `<div class="mchip"><span class="mval">${value}"</span><span class="mlbl">${label}</span></div>`;
}

export function buildReceiptHtml(order: Order, customer: Customer, measurement?: Measurement | null): string {
  const now = new Date().toLocaleDateString("ur-PK", { day: "numeric", month: "long", year: "numeric" });
  const dueDate = order.dueDate
    ? new Date(order.dueDate).toLocaleDateString("ur-PK", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const balance = Math.max(0, order.price - order.advancePayment);

  const measHtml = measurement
    ? `
    <div class="section">
      <div class="sec-title">پیمائش — ${measurement.name}</div>
      <div class="meas-grid">
        ${measRow("بازو", measurement.bazu)}
        ${measRow("تیرا", measurement.tera)}
        ${measRow("گلا", measurement.gala)}
        ${measRow("چھاتی", measurement.chati)}
        ${measRow("کمر", measurement.kamar)}
        ${measRow("گھیرا", measurement.ghera)}
        ${measRow("لمبائی شرٹ", measurement.shirtLambai)}
        ${measRow("لمبائی شلوار", measurement.shilwarLambai)}
        ${measRow("پائنچہ", measurement.paincha)}
      </div>
      <div class="meas-badges">
        <span class="badge">${COLLAR_UR[measurement.collar] ?? measurement.collar}</span>
        <span class="badge">${GHERA_UR[measurement.gheraType] ?? measurement.gheraType}</span>
        ${measurement.shilwarJaib ? '<span class="badge">شلوار جیب</span>' : ""}
        ${measurement.shirtFrontJaib ? '<span class="badge">شرٹ فرنٹ جیب</span>' : ""}
      </div>
      ${measurement.notes ? `<div class="notes">${measurement.notes}</div>` : ""}
    </div>`
    : "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ur">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet" />
  <title>رسید</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Nastaliq Urdu', serif; background: #FFF9F5; color: #1A1A1A; direction: rtl; padding: 24px; font-size: 15px; line-height: 1.8; }
    .header { background: #98541D; color: #FFFFFF; border-radius: 16px; padding: 24px 20px 20px; text-align: center; margin-bottom: 20px; }
    .scissors { font-size: 32px; margin-bottom: 4px; }
    .shop-name { font-size: 36px; font-weight: 700; line-height: 1.6; }
    .owner-name { font-size: 20px; opacity: 0.85; margin-top: 2px; }
    .receipt-meta { display: flex; justify-content: space-between; align-items: center; background: #F0E8DF; border-radius: 10px; padding: 10px 16px; margin-bottom: 16px; font-size: 13px; color: #888070; }
    .receipt-id { font-size: 12px; }
    .section { background: #FFFFFF; border: 1px solid #DDD3C8; border-radius: 14px; padding: 16px; margin-bottom: 14px; }
    .sec-title { font-size: 16px; font-weight: 600; color: #98541D; border-bottom: 1px solid #F0E8DF; padding-bottom: 8px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    .lbl { color: #888070; font-size: 14px; padding: 7px 0; text-align: right; width: 40%; }
    .val { font-size: 15px; padding: 7px 0; text-align: left; border-bottom: 1px solid #F5F0EB; }
    .val.hl { color: #98541D; font-weight: 600; font-size: 16px; }
    .meas-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; justify-content: flex-end; }
    .mchip { background: #F0E8DF; border-radius: 8px; padding: 6px 10px; display: flex; flex-direction: column; align-items: center; min-width: 64px; }
    .mval { font-size: 15px; font-weight: 600; color: #98541D; }
    .mlbl { font-size: 11px; color: #888070; }
    .meas-badges { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; margin-top: 6px; }
    .badge { background: #F0E8DF; color: #98541D; border-radius: 20px; padding: 3px 12px; font-size: 13px; }
    .notes { color: #888070; font-size: 13px; margin-top: 8px; text-align: right; }
    .status-pill { display: inline-block; background: #98541D22; color: #98541D; border-radius: 20px; padding: 3px 14px; font-size: 13px; }
    .footer { text-align: center; color: #B0A090; font-size: 13px; margin-top: 20px; padding-top: 16px; border-top: 1px dashed #DDD3C8; }
    .total-box { background: #98541D; color: #FFFFFF; border-radius: 12px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
    .total-label { font-size: 16px; }
    .total-value { font-size: 22px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="header">
    <div class="scissors">✂</div>
    <div class="shop-name">ٹیلر ماسٹر</div>
    <div class="owner-name">محمد اشرف</div>
  </div>
  <div class="receipt-meta">
    <span class="receipt-id">#${order.id.slice(-6).toUpperCase()}</span>
    <span>${now}</span>
  </div>
  <div class="section">
    <div class="sec-title">گاہک کی تفصیل</div>
    <table>
      ${row("نام", customer.name)}
      ${customer.phone ? row("فون", customer.phone) : ""}
      ${customer.address ? row("پتہ", customer.address) : ""}
    </table>
  </div>
  <div class="section">
    <div class="sec-title">آرڈر کی تفصیل</div>
    <table>
      ${row("تفصیل", order.description)}
      <tr><td class="val"><span class="status-pill">${STATUS_UR[order.status] ?? order.status}</span></td><td class="lbl">حالت</td></tr>
      ${row("ڈیلیوری تاریخ", dueDate)}
    </table>
  </div>
  ${measHtml}
  <div class="section">
    <div class="sec-title">ادائیگی</div>
    <table>
      ${row("کل قیمت", `Rs ${order.price.toLocaleString()}`)}
      ${row("پیشگی ادا", `Rs ${order.advancePayment.toLocaleString()}`)}
    </table>
    <div class="total-box">
      <span class="total-value">Rs ${balance.toLocaleString()}</span>
      <span class="total-label">باقی رقم</span>
    </div>
  </div>
  ${order.notes ? `<div class="section"><div class="sec-title">نوٹس</div><div style="text-align:right;color:#444">${order.notes}</div></div>` : ""}
  <div class="footer">شکریہ! دوبارہ تشریف لائیں ٹیلر ماسٹر پر</div>
</body>
</html>`;
}
