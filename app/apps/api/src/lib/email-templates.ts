const STACKFIX_ADDRESS = "1 KN 78 St, Kigali, Rwanda";
const STACKFIX_DISCLAIMER =
  "This email was sent by StackFix on behalf of your repair workshop. If you did not request this action, you can safely ignore this message. StackFix will never ask for your password by email.";

type PasswordResetEmailParams = {
  resetUrl: string;
  userName: string;
  logoUrl: string;
};

export function buildPasswordResetEmailHtml({
  resetUrl,
  userName,
  logoUrl,
}: PasswordResetEmailParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your StackFix password</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:#0d1f12;">
              <img src="${logoUrl}" alt="StackFix" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:12px;" />
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">StackFix</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;font-weight:700;">Reset your password</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                Hi ${escapeHtml(userName)},<br /><br />
                We received a request to reset the password for your StackFix workshop account. Click the button below to choose a new password. This link expires in 1 hour.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:12px;background:#00b341;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#07131c;text-decoration:none;">Reset password</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">
                If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#00b341;word-break:break-all;">
                <a href="${resetUrl}" style="color:#00b341;text-decoration:underline;">${resetUrl}</a>
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
                If you did not request a password reset, you can ignore this email — your password will stay the same.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">
                <strong style="color:#374151;">StackFix</strong><br />
                ${STACKFIX_ADDRESS}
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center;">
                ${STACKFIX_DISCLAIMER}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildPasswordResetEmailText({
  resetUrl,
  userName,
}: Omit<PasswordResetEmailParams, "logoUrl">): string {
  return `Hi ${userName},

We received a request to reset your StackFix password.

Reset your password (expires in 1 hour):
${resetUrl}

If you did not request this, ignore this email.

StackFix
${STACKFIX_ADDRESS}

${STACKFIX_DISCLAIMER}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
