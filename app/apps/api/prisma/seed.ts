import { PrismaClient } from "@prisma/client";
import { AuthService } from "../src/services/auth.service.js";
import { DEMO_ACCOUNTS, STACKFIX_DOMAIN } from "@stackfix/utils";

const prisma = new PrismaClient();

const LEGACY_EMAIL_MAP: Record<string, string> = {
  "kevin@stackfix.rw": DEMO_ACCOUNTS.superAdmin.email,
  "admin@stackfix.rw": DEMO_ACCOUNTS.admin.email,
  "eric@stackfix.rw": DEMO_ACCOUNTS.technician.email,
};

async function migrateLegacyEmails() {
  for (const [legacy, current] of Object.entries(LEGACY_EMAIL_MAP)) {
    await prisma.user.updateMany({ where: { email: legacy }, data: { email: current } });
  }
}

async function main() {
  await migrateLegacyEmails();

  const passwordHash = await AuthService.hashPassword(DEMO_ACCOUNTS.superAdmin.password);

  const org = await prisma.organisation.upsert({
    where: { slug: "ace-repairs-kigali" },
    update: {},
    create: {
      name: "Ace Repairs Kigali",
      slug: "ace-repairs-kigali",
      address: "KN 4 Ave, Kigali, Rwanda",
      phone: "+250788000000",
      email: "hello@ace-repairs.rw",
      paymentModel: "pay_on_pickup",
      defaultVatRate: 18,
      language: "en",
      rdbNumber: "DEMO-RDB-001",
    },
  });

  await prisma.ticketCounter.upsert({
    where: { organisationId: org.id },
    update: {},
    create: { organisationId: org.id, lastNumber: 0 },
  });

  await prisma.invoiceCounter.upsert({
    where: { organisationId: org.id },
    update: {},
    create: { organisationId: org.id, lastNumber: 0 },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: DEMO_ACCOUNTS.superAdmin.email },
    update: { passwordHash, role: "super_admin" },
    create: {
      organisationId: org.id,
      fullName: "Kevin Eric",
      email: DEMO_ACCOUNTS.superAdmin.email,
      phone: "+250788000001",
      passwordHash,
      role: "super_admin",
    },
  });

  const adminHash = await AuthService.hashPassword(DEMO_ACCOUNTS.admin.password);
  const manager = await prisma.user.upsert({
    where: { email: DEMO_ACCOUNTS.admin.email },
    update: { passwordHash: adminHash, role: "admin" },
    create: {
      organisationId: org.id,
      fullName: "Sarah Umutoni",
      email: DEMO_ACCOUNTS.admin.email,
      phone: "+250788000003",
      passwordHash: adminHash,
      role: "admin",
    },
  });

  const techHash = await AuthService.hashPassword(DEMO_ACCOUNTS.technician.password);
  const technician = await prisma.user.upsert({
    where: { email: DEMO_ACCOUNTS.technician.email },
    update: { passwordHash: techHash, role: "technician" },
    create: {
      organisationId: org.id,
      fullName: "Eric Kayonga",
      email: DEMO_ACCOUNTS.technician.email,
      phone: "+250788000002",
      passwordHash: techHash,
      role: "technician",
    },
  });

  console.log("Seed complete:");
  console.log("  Organisation:", org.name);
  console.log("  Domain:", STACKFIX_DOMAIN);
  console.log(`  Super Admin:  ${DEMO_ACCOUNTS.superAdmin.email} / ${DEMO_ACCOUNTS.superAdmin.password}`);
  console.log(`  Admin:        ${DEMO_ACCOUNTS.admin.email} / ${DEMO_ACCOUNTS.admin.password}`);
  console.log(`  Technician:   ${DEMO_ACCOUNTS.technician.email} / ${DEMO_ACCOUNTS.technician.password}`);
  console.log("  Super Admin ID:", superAdmin.id);
  console.log("  Admin ID:", manager.id);
  console.log("  Technician ID:", technician.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
