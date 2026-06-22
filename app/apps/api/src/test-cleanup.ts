import { prisma } from "./lib/prisma.js";

export async function deleteMessageThread(threadId: string) {
  await prisma.userNotification.deleteMany({
    where: { href: { contains: threadId } },
  });
  await prisma.staffMessage.deleteMany({
    where: { OR: [{ id: threadId }, { parentId: threadId }] },
  });
}

export async function forceDeleteTicket(ticketId: string) {
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({ where: { ticketId } });
    if (invoice) {
      await tx.payment.deleteMany({ where: { invoiceId: invoice.id } });
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: invoice.id } });
      await tx.invoice.delete({ where: { id: invoice.id } });
    }
    await tx.notification.deleteMany({ where: { ticketId } });
    await tx.staffMessage.deleteMany({ where: { ticketId } });
    await tx.ticketNote.deleteMany({ where: { ticketId } });
    await tx.ticketStatusHistory.deleteMany({ where: { ticketId } });
    await tx.ticket.delete({ where: { id: ticketId } });
  });
}
