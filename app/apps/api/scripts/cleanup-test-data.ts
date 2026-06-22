/**
 * Deletes ONLY automated test artifacts — never user-created records.
 * Run: pnpm --filter @stackfix/api db:cleanup-test
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_CUSTOMER_PATTERNS = ["Delete Test", "Upsert Test", "Upsert Updated"];

const TEST_MESSAGE_SUBJECTS = [
  "Need ticket edit approval",
  "Testing",
  "Ticket ref test",
  "Delete request test",
  "Notification test thread",
];

const TEST_FAULT_DESCRIPTIONS = ["Delete flow test"];

/** Ad-hoc test accounts created outside seed — not demo logins. */
const STRAY_TEST_USER_NAMES = ["Mike", "tope"];

async function deleteOrphanMessageNotifications() {
  const rows = await prisma.userNotification.findMany({
    where: { href: { startsWith: "/messages?id=" } },
    select: { id: true, href: true },
  });

  const orphanIds: string[] = [];
  for (const row of rows) {
    const threadId = row.href?.split("=")[1];
    if (!threadId) continue;
    const exists = await prisma.staffMessage.findFirst({
      where: { id: threadId, parentId: null },
    });
    if (!exists) orphanIds.push(row.id);
  }

  if (orphanIds.length) {
    await prisma.userNotification.deleteMany({ where: { id: { in: orphanIds } } });
  }
  return orphanIds.length;
}

async function deleteTestPatternNotifications() {
  const result = await prisma.userNotification.deleteMany({
    where: {
      OR: [
        { body: { contains: "Delete Test" } },
        ...TEST_MESSAGE_SUBJECTS.map((subject) => ({ body: { contains: subject } })),
      ],
    },
  });
  return result.count;
}

async function deleteOrphanInvoiceNotifications() {
  const rows = await prisma.userNotification.findMany({
    where: { href: { startsWith: "/invoices?id=" } },
    select: { id: true, href: true },
  });

  const orphanIds: string[] = [];
  for (const row of rows) {
    const invoiceId = row.href?.split("=")[1];
    if (!invoiceId) continue;
    const exists = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!exists) orphanIds.push(row.id);
  }

  if (orphanIds.length) {
    await prisma.userNotification.deleteMany({ where: { id: { in: orphanIds } } });
  }
  return orphanIds.length;
}

async function deleteTestActivityLogs() {
  const result = await prisma.activityLog.deleteMany({
    where: {
      OR: [
        {
          metadata: {
            path: ["customerName"],
            string_starts_with: "Delete Test",
          },
        },
        ...TEST_MESSAGE_SUBJECTS.map((subject) => ({
          metadata: { path: ["subject"], equals: subject },
        })),
      ],
    },
  });
  return result.count;
}

async function deleteStrayTestUsers() {
  const users = await prisma.user.findMany({
    where: { fullName: { in: STRAY_TEST_USER_NAMES } },
    select: { id: true, fullName: true },
  });

  let removed = 0;
  for (const user of users) {
    const hasTickets = await prisma.ticket.count({
      where: {
        OR: [{ createdByUserId: user.id }, { technicianId: user.id }],
      },
    });
    const hasMessages = await prisma.staffMessage.count({ where: { senderId: user.id } });
    if (hasTickets || hasMessages) continue;

    await prisma.userNotification.deleteMany({
      where: { body: { contains: user.fullName } },
    });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.userNotification.deleteMany({ where: { userId: user.id } });
    await prisma.activityLog.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    removed++;
  }
  return removed;
}

async function main() {
  const testCustomers = await prisma.customer.findMany({
    where: {
      OR: TEST_CUSTOMER_PATTERNS.map((p) => ({ fullName: { startsWith: p } })),
    },
    select: { id: true },
  });
  const testCustomerIds = testCustomers.map((c) => c.id);

  const testTickets = await prisma.ticket.findMany({
    where: {
      OR: [
        { faultDescription: { in: TEST_FAULT_DESCRIPTIONS } },
        ...(testCustomerIds.length ? [{ customerId: { in: testCustomerIds } }] : []),
      ],
    },
    select: { id: true },
  });

  const testThreads = await prisma.staffMessage.findMany({
    where: {
      parentId: null,
      subject: { in: TEST_MESSAGE_SUBJECTS },
    },
    select: { id: true },
  });

  let ticketsDeleted = 0;
  for (const { id } of testTickets) {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { ticketId: id } });
      if (invoice) {
        await tx.payment.deleteMany({ where: { invoiceId: invoice.id } });
        await tx.invoiceLineItem.deleteMany({ where: { invoiceId: invoice.id } });
        await tx.invoice.delete({ where: { id: invoice.id } });
      }
      await tx.notification.deleteMany({ where: { ticketId: id } });
      await tx.staffMessage.deleteMany({ where: { ticketId: id } });
      await tx.ticketNote.deleteMany({ where: { ticketId: id } });
      await tx.ticketStatusHistory.deleteMany({ where: { ticketId: id } });
      await tx.activityLog.deleteMany({
        where: { href: { in: [`/tickets/${id}`] } },
      });
      await tx.ticket.delete({ where: { id } });
    });
    ticketsDeleted++;
  }

  if (testCustomerIds.length) {
    await prisma.customer.deleteMany({
      where: {
        id: { in: testCustomerIds },
        tickets: { none: {} },
      },
    });
  }

  let threadsDeleted = 0;
  for (const { id } of testThreads) {
    await prisma.userNotification.deleteMany({ where: { href: { contains: id } } });
    await prisma.staffMessage.deleteMany({
      where: { OR: [{ id }, { parentId: id }] },
    });
    threadsDeleted++;
  }

  const orphanCustomers = await prisma.customer.deleteMany({
    where: {
      OR: TEST_CUSTOMER_PATTERNS.map((p) => ({ fullName: { startsWith: p } })),
      tickets: { none: {} },
    },
  });

  const orphanMessageNotifs = await deleteOrphanMessageNotifications();
  const patternNotifs = await deleteTestPatternNotifications();
  const orphanInvoiceNotifs = await deleteOrphanInvoiceNotifications();
  const activityLogs = await deleteTestActivityLogs();
  const strayUsers = await deleteStrayTestUsers();

  console.log("Test-only cleanup complete (user data preserved):");
  console.log(`  Test tickets removed:           ${ticketsDeleted}`);
  console.log(`  Test message threads:           ${threadsDeleted}`);
  console.log(`  Test customers removed:         ${orphanCustomers.count}`);
  console.log(`  Orphan message notifications:   ${orphanMessageNotifs}`);
  console.log(`  Test-pattern notifications:       ${patternNotifs}`);
  console.log(`  Orphan invoice notifications:     ${orphanInvoiceNotifs}`);
  console.log(`  Test activity log entries:        ${activityLogs}`);
  console.log(`  Stray test users removed:         ${strayUsers}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
