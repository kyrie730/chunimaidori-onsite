function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function otpEmail({ fullName, otp }: { fullName: string; otp: string }) {
  const name = escapeHtml(fullName || "Participant");
  const digits = escapeHtml(otp)
    .split("")
    .map(
      (d) =>
        `<td style="width:44px;height:56px;border:1px solid #d4d4d8;border-radius:10px;background:#fafafa;font-family:'SFMono-Regular',Consolas,monospace;font-size:28px;font-weight:700;color:#18181b;text-align:center;">${d}</td>`,
    )
    .join('<td style="width:8px;"></td>');

  const subject =
    "Your ChuniMaiDori Onsite Check-in Code / Kode Check-in Onsite ChuniMaiDori";

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="background:#18181b;padding:24px 28px;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:4px;">ChuniMaiDori</div>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 12px;font-size:16px;">Hi <strong>${name}</strong>,</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#3f3f46;">
            Here is your personal code for the <strong>ChuniMaiDori onsite event</strong>. Show this code to our staff at the venue to
            <strong>check in for the competition</strong> and to <strong>claim your goodie bag and jersey</strong>.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 20px;"><tr>${digits}</tr></table>
          <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#71717a;text-align:center;">
            Please keep this code private and do not share it with anyone other than event staff.
          </p>
          <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 24px;">
          <p style="margin:0 0 12px;font-size:16px;">Halo <strong>${name}</strong>,</p>
          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3f3f46;">
            Berikut adalah kode pribadi kamu untuk <strong>event onsite ChuniMaiDori</strong>. Tunjukkan kode ini ke staff kami di lokasi untuk
            <strong>check-in kompetisi</strong> serta <strong>mengambil goodie bag dan jersey</strong>.
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
            Mohon jaga kerahasiaan kode ini dan jangan bagikan ke siapa pun selain staff event.
          </p>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:12px;color:#a1a1aa;text-align:center;">
          This is an automated email, please do not reply. / Email ini dikirim otomatis, mohon tidak membalas.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${fullName || "Participant"},

Your ChuniMaiDori onsite event code: ${otp}

Show this code to our staff at the venue to check in for the competition and to claim your goodie bag and jersey.
Please keep this code private.

---

Halo ${fullName || "Peserta"},

Kode event onsite ChuniMaiDori kamu: ${otp}

Tunjukkan kode ini ke staff kami di lokasi untuk check-in kompetisi serta mengambil goodie bag dan jersey.
Mohon jaga kerahasiaan kode ini.

This is an automated email, please do not reply.`;

  return { subject, html, text };
}
