import { logger } from "../lib/logger.js";
import { STACKFIX_URLS } from "@stackfix/utils";
import {
  buildPasswordResetEmailHtml,
  buildPasswordResetEmailText,
} from "../lib/email-templates.js";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
};

export class EmailService {
  async sendPasswordResetEmail(params: {
    to: string;
    userName: string;
    resetUrl: string;
  }): Promise<void> {
    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
    const logoUrl = `${webUrl}/brand/stackfix-icon.png`;

    await this.send({
      to: params.to,
      subject: "Reset your StackFix password",
      html: buildPasswordResetEmailHtml({
        resetUrl: params.resetUrl,
        userName: params.userName,
        logoUrl,
      }),
      text: buildPasswordResetEmailText({
        resetUrl: params.resetUrl,
        userName: params.userName,
      }),
    });
  }

  /** Customer-facing notifications — sent from notifications@stackfix.app. */
  async sendCustomerEmail(params: SendEmailParams): Promise<void> {
    const from =
      process.env.NOTIFICATIONS_EMAIL_FROM ?? `StackFix <${STACKFIX_URLS.notifications}>`;
    await this.send({ ...params, from });
  }

  private async send(params: SendEmailParams): Promise<void> {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    const from = params.from ?? SMTP_FROM ?? `StackFix <${STACKFIX_URLS.noreply}>`;

    if (!SMTP_HOST) {
      logger.info("Email (dev mode — no SMTP configured)", {
        to: params.to,
        from,
        subject: params.subject,
        preview: params.text.slice(0, 200),
      });
      return;
    }

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: SMTP_PORT === "465",
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });

    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  }
}

export const emailService = new EmailService();
