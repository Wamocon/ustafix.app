"use server";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface InviteEmailParams {
  to: string;
  inviterName: string;
  projectName: string;
  role: string;
  inviteLink: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  manager: "Bauleiter",
  worker: "Mitarbeiter",
};

export async function sendInviteEmail(
  params: InviteEmailParams
): Promise<boolean> {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY not configured — invite email not sent. Link must be shared manually."
    );
    return false;
  }

  const roleName = ROLE_LABELS[params.role] ?? params.role;

  try {
    const { error } = await resend.emails.send({
      from: "Ustafix <noreply@ustafix.app>",
      to: params.to,
      subject: `Einladung zum Projekt "${params.projectName}" — Ustafix`,
      html: buildInviteHtml(params, roleName),
    });

    if (error) {
      console.error("Resend error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

function buildInviteHtml(
  params: InviteEmailParams,
  roleName: string
): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:'Arial Narrow',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;border-bottom:2px solid #f59e0b;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:24px;font-weight:800;color:#1c1917;letter-spacing:-0.5px;">Ustafix</span>
                    <span style="font-size:24px;font-weight:800;color:#f59e0b;">.app</span>
                  </td>
                  <td align="right" style="font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:1px;">
                    WAMOCON GmbH
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1c1917;">
                Projekteinladung
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#78716c;line-height:1.6;">
                <strong style="color:#1c1917;">${params.inviterName}</strong> hat Sie zum folgenden Projekt eingeladen:
              </p>

              <!-- Project card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;border-radius:12px;border:1px solid #e7e5e4;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1c1917;">${params.projectName}</p>
                    <p style="margin:0;font-size:13px;color:#78716c;">
                      Ihre Rolle: <strong style="color:#f59e0b;">${roleName}</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="${params.inviteLink}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
                      Einladung annehmen
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#a8a29e;line-height:1.5;">
                Diese Einladung ist 7 Tage gültig. Falls Sie kein Konto haben,
                können Sie sich über den Link registrieren.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e7e5e4;background:#f5f5f4;">
              <p style="margin:0;font-size:11px;color:#a8a29e;line-height:1.5;">
                WAMOCON GmbH &middot; Baumängel-Management<br>
                Diese E-Mail wurde automatisch von Ustafix.app versendet.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
