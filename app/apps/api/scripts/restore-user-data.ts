/**
 * Restores user-created records captured from session snapshots.
 * Run: pnpm --filter @stackfix/api db:restore-user-data
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organisation.findFirst();
  if (!org) throw new Error("No organisation found — run db:seed first");

  const eric = await prisma.user.findFirst({
    where: { organisationId: org.id, email: "eric@stackfix.app" },
  });
  if (!eric) throw new Error("Technician user not found");

  const existing = await prisma.ticket.findFirst({
    where: { organisationId: org.id, ticketNumber: "TKT-0033" },
  });
  if (existing) {
    console.log("TKT-0033 already exists — nothing to restore.");
    return;
  }

  let customer = await prisma.customer.findFirst({
    where: { organisationId: org.id, phone: "250790837837" },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        organisationId: org.id,
        fullName: "Jonah Abel",
        phone: "250790837837",
        totalRepairs: 1,
      },
    });
  }

  const ticket = await prisma.ticket.create({
    data: {
      organisationId: org.id,
      ticketNumber: "TKT-0033",
      customerId: customer.id,
      technicianId: eric.id,
      createdByUserId: eric.id,
      deviceType: "Printer",
      deviceBrand: "HP",
      deviceModel: "HP LaserJet F483",
      faultDescription: "Bad Ink",
      status: "pending",
      priority: "normal",
    },
  });

  await prisma.ticketStatusHistory.create({
    data: {
      ticketId: ticket.id,
      fromStatus: null,
      toStatus: "pending",
      changedByUserId: eric.id,
      trigger: "system",
    },
  });

  await prisma.ticketCounter.upsert({
    where: { organisationId: org.id },
    create: { organisationId: org.id, lastNumber: 33 },
    update: { lastNumber: 33 },
  });

  console.log("Restored user data:");
  console.log(`  Ticket #TKT-0033 — Jonah Abel (HP LaserJet F483, Bad Ink)`);
  console.log(`  Created by: Eric Kayonga`);
  console.log("");
  console.log("Note: Only records visible in your session could be recovered.");
  console.log("If you had other tickets/customers, please share details to restore them.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
