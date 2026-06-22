import type { PrismaClient } from "@prisma/client";

export async function nextTicketNumber(
  prisma: PrismaClient,
  organisationId: string,
): Promise<string> {
  const counter = await prisma.ticketCounter.upsert({
    where: { organisationId },
    create: { organisationId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  const num = counter.lastNumber;
  return `TKT-${String(num).padStart(4, "0")}`;
}

export async function nextInvoiceNumber(
  prisma: PrismaClient,
  organisationId: string,
): Promise<string> {
  const counter = await prisma.invoiceCounter.upsert({
    where: { organisationId },
    create: { organisationId, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  const num = counter.lastNumber;
  return `INV-${String(num).padStart(4, "0")}`;
}
