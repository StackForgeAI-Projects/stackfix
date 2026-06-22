import type { PrismaClient, TicketStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { whatsappService } from "./whatsapp.service.js";
import { emailService } from "./email.service.js";
import {
  buildInvoiceWhatsApp,
  buildPaymentWhatsApp,
  buildStatusWhatsApp,
  statusCustomerMessage,
} from "../lib/customer-messages.js";
import {
  buildInvoiceEmail,
  buildPaymentEmail,
  buildStatusEmail,
  type CustomerEmailContent,
} from "../lib/customer-email-templates.js";

function deviceDescription(t: {
  deviceBrand: string | null;
  deviceModel: string | null;
  deviceType: string;
}): string {
  return [t.deviceBrand, t.deviceModel, t.deviceType].filter(Boolean).join(" ") || t.deviceType;
}

function logoUrl(): string | undefined {
  const web = process.env.WEB_URL;
  return web ? `${web}/brand/stackfix-icon.png` : undefined;
}

type DispatchTarget = {
  orgId: string;
  ticketId: string | null;
  customerId: string | null;
  phone: string | null;
  email: string | null;
};

/**
 * Sends customer-facing WhatsApp + Email notifications for invoice and repair
 * events. All public methods are fire-and-forget: a delivery failure is logged
 * and recorded but never propagates back to the invoice/ticket transaction.
 */
export class CustomerNotificationService {
  constructor(private db: PrismaClient = prisma) {}

  notifyInvoiceRaised(invoiceId: string): void {
    this.emit(() => this.handleInvoiceRaised(invoiceId));
  }

  notifyPaymentReceived(invoiceId: string): void {
    this.emit(() => this.handlePaymentReceived(invoiceId));
  }

  notifyStatusChange(ticketId: string, toStatus: TicketStatus): void {
    this.emit(() => this.handleStatusChange(ticketId, toStatus));
  }

  private emit(fn: () => Promise<void>): void {
    void fn().catch((err) =>
      logger.error("Customer notification error", { err: String(err) }),
    );
  }

  private async handleInvoiceRaised(invoiceId: string): Promise<void> {
    const invoice = await this.db.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, ticket: true, organisation: true },
    });
    if (!invoice) return;
    const { customer, ticket, organisation: org } = invoice;
    const device = deviceDescription(ticket);
    const amount = Number(invoice.totalAmount);
    const bank = {
      name: org.bankName,
      accountName: org.bankAccountName,
      accountNumber: org.bankAccountNumber,
    };

    const whatsappBody = buildInvoiceWhatsApp({
      businessName: org.name,
      businessPhone: org.phone,
      customerName: customer.fullName,
      invoiceNumber: invoice.invoiceNumber,
      deviceDescription: device,
      faultDescription: ticket.faultDescription,
      amount,
      ussdCode: invoice.ussdCode,
      bank,
    });
    const emailContent = customer.email
      ? buildInvoiceEmail({
          businessName: org.name,
          businessAddress: org.address,
          businessPhone: org.phone,
          logoUrl: logoUrl(),
          customerName: customer.fullName,
          invoiceNumber: invoice.invoiceNumber,
          deviceDescription: device,
          faultDescription: ticket.faultDescription,
          amount,
          ussdCode: invoice.ussdCode,
          bank,
        })
      : null;

    await this.dispatch(
      {
        orgId: org.id,
        ticketId: ticket.id,
        customerId: customer.id,
        phone: customer.phone,
        email: customer.email,
      },
      whatsappBody,
      emailContent,
    );
  }

  private async handlePaymentReceived(invoiceId: string): Promise<void> {
    const invoice = await this.db.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, ticket: true, organisation: true },
    });
    if (!invoice) return;
    const { customer, ticket, organisation: org } = invoice;
    const amount = Number(invoice.totalAmount);

    const whatsappBody = buildPaymentWhatsApp({
      businessName: org.name,
      businessPhone: org.phone,
      customerName: customer.fullName,
      invoiceNumber: invoice.invoiceNumber,
      amount,
    });
    const emailContent = customer.email
      ? buildPaymentEmail({
          businessName: org.name,
          businessAddress: org.address,
          businessPhone: org.phone,
          logoUrl: logoUrl(),
          customerName: customer.fullName,
          invoiceNumber: invoice.invoiceNumber,
          amount,
        })
      : null;

    await this.dispatch(
      {
        orgId: org.id,
        ticketId: ticket.id,
        customerId: customer.id,
        phone: customer.phone,
        email: customer.email,
      },
      whatsappBody,
      emailContent,
    );
  }

  private async handleStatusChange(ticketId: string, toStatus: TicketStatus): Promise<void> {
    const ticket = await this.db.ticket.findUnique({
      where: { id: ticketId },
      include: { customer: true, organisation: true, invoice: true },
    });
    if (!ticket) return;
    const { customer, organisation: org } = ticket;
    const device = deviceDescription(ticket);
    const statusMessage = statusCustomerMessage(toStatus, {
      paymentModel: org.paymentModel,
      invoicePaid: ticket.invoice?.status === "paid",
    });

    const whatsappBody = buildStatusWhatsApp({
      businessName: org.name,
      businessPhone: org.phone,
      customerName: customer.fullName,
      ticketNumber: ticket.ticketNumber,
      deviceDescription: device,
      status: toStatus,
      statusMessage,
    });
    const emailContent = customer.email
      ? buildStatusEmail({
          businessName: org.name,
          businessAddress: org.address,
          businessPhone: org.phone,
          logoUrl: logoUrl(),
          customerName: customer.fullName,
          ticketNumber: ticket.ticketNumber,
          deviceDescription: device,
          status: toStatus,
          statusMessage,
        })
      : null;

    await this.dispatch(
      {
        orgId: org.id,
        ticketId: ticket.id,
        customerId: customer.id,
        phone: customer.phone,
        email: customer.email,
      },
      whatsappBody,
      emailContent,
    );
  }

  private async dispatch(
    target: DispatchTarget,
    whatsappBody: string,
    emailContent: CustomerEmailContent | null,
  ): Promise<void> {
    if (target.phone) {
      await this.sendOne("whatsapp", target, whatsappBody);
    }
    if (target.email && emailContent) {
      await this.sendOne("email", target, emailContent.text, emailContent);
    }
  }

  private async sendOne(
    channel: "whatsapp" | "email",
    target: DispatchTarget,
    body: string,
    emailContent?: CustomerEmailContent,
  ): Promise<void> {
    const record = await this.db.notification.create({
      data: {
        organisationId: target.orgId,
        ticketId: target.ticketId,
        customerId: target.customerId,
        channel,
        messageBody: body,
        status: "pending",
      },
    });

    try {
      let providerMessageId: string | null = null;
      if (channel === "whatsapp" && target.phone) {
        const result = await whatsappService.sendText({ to: target.phone, body });
        providerMessageId = result.id ?? null;
      } else if (channel === "email" && target.email && emailContent) {
        await emailService.sendCustomerEmail({
          to: target.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });
      }
      await this.db.notification.update({
        where: { id: record.id },
        data: { status: "sent", sentAt: new Date(), providerMessageId },
      });
    } catch (err) {
      logger.error("Customer notification delivery failed", {
        channel,
        err: String(err),
      });
      await this.db.notification.update({
        where: { id: record.id },
        data: { status: "failed" },
      });
    }
  }
}

export const customerNotificationService = new CustomerNotificationService();
