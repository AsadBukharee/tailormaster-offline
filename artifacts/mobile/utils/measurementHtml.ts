import type { Customer, Measurement } from "@/context/DatabaseContext";

const COLLAR_UR: Record<string, string> = { collar: "کالر", bain: "بین" };
const GHERA_UR: Record<string, string> = { square: "چورس گھیرا", round: "گول گھیرا" };

function measRow(label: string, value: number | null | undefined): string {
  if (value == null) return "";
  return `
    <tr>
      <td class="mval">${value}"</td>
      <td class="dots"></td>
      <td class="mlbl">${label}</td>
    </tr>`;
}

export function buildMeasurementPdfHtml(customer: Customer, measurement: Measurement): string {
  const now = new Date().toLocaleDateString("ur-PK", { day: "numeric", month: "long", year: "numeric" });
  const badges = [
    COLLAR_UR[measurement.collar] ?? measurement.collar,
    GHERA_UR[measurement.gheraType] ?? measurement.gheraType,
    ...(measurement.shilwarJaib ? ["شلوار جیب"] : []),
    ...(measurement.shirtFrontJaib ? ["شرٹ فرنٹ جیب"] : []),
  ];

  return `<!DOCTYPE html>
<html dir="rtl" lang="ur">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Noto Nastaliq Urdu', serif; background: #F5EDE3; direction: rtl; padding: 20px; min-height: 100vh; }
    .paper { background: #FFFDF9; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.12); max-width: 480px; margin: 0 auto; }
    .header { background: #98541D; padding: 20px 20px 16px; text-align: center; }
    .shop { font-size: 28px; font-weight: 700; color: #FFF; line-height: 1.8; }
    .sub { font-size: 16px; color: rgba(255,255,255,0.85); line-height: 1.6; margin-top: 2px; }
    .customer-bar { background: #F0E8DF; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #888070; line-height: 1.6; }
    .meas-name { font-size: 20px; font-weight: 600; color: #98541D; text-align: center; padding: 14px 20px 10px; border-bottom: 2px solid #F0E8DF; line-height: 1.8; }
    .lines-section { padding: 4px 0; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #F0EBE3; }
    tr:nth-child(even) { background: #FDFAF6; }
    .mlbl { font-size: 15px; color: #5A4030; padding: 10px 20px 10px 0; text-align: right; width: 45%; line-height: 1.8; }
    .dots { border-bottom: 2px dotted #D5C5B5; width: 30%; }
    .mval { font-size: 17px; font-weight: 600; color: #98541D; padding: 10px 0 10px 20px; text-align: left; width: 25%; }
    .badges-row { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 20px; justify-content: center; border-top: 2px solid #F0E8DF; }
    .badge { background: #F0E8DF; color: #98541D; border-radius: 20px; padding: 4px 14px; font-size: 13px; line-height: 1.8; }
    .notes-section { padding: 12px 20px 20px; border-top: 1px solid #F0E8DF; }
    .notes-label { font-size: 13px; color: #888070; margin-bottom: 4px; line-height: 1.6; }
    .notes-text { font-size: 14px; color: #5A4030; line-height: 1.8; }
    .footer { background: #F0E8DF; text-align: center; padding: 10px; font-size: 12px; color: #B09070; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="paper">
    <div class="header">
      <div class="shop">✂ ٹیلر ماسٹر</div>
      <div class="sub">محمد اشرف</div>
    </div>
    <div class="customer-bar">
      <span>${now}</span>
      <span>گاہک: ${customer.name}${customer.phone ? " · " + customer.phone : ""}</span>
    </div>
    <div class="meas-name">${measurement.name}</div>
    <div class="lines-section">
      <table>
        ${measRow("بازو", measurement.bazu)}
        ${measRow("تیرا", measurement.tera)}
        ${measRow("گلا", measurement.gala)}
        ${measRow("چھاتی", measurement.chati)}
        ${measRow("کمر", measurement.kamar)}
        ${measRow("گھیرا", measurement.ghera)}
        ${measRow("لمبائی شرٹ", measurement.shirtLambai)}
        ${measRow("لمبائی شلوار", measurement.shilwarLambai)}
        ${measRow("پائنچہ", measurement.paincha)}
      </table>
    </div>
    <div class="badges-row">
      ${badges.map((b) => `<span class="badge">${b}</span>`).join("")}
    </div>
    ${measurement.notes ? `
    <div class="notes-section">
      <div class="notes-label">اضافی تفصیل</div>
      <div class="notes-text">${measurement.notes}</div>
    </div>` : ""}
    <div class="footer">ٹیلر ماسٹر — محمد اشرف</div>
  </div>
</body>
</html>`;
}
