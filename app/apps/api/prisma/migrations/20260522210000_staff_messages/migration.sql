-- In-app staff messaging (technician → admin collaboration)
CREATE TYPE "StaffMessageRequestType" AS ENUM ('general', 'edit_ticket', 'delete_ticket');
CREATE TYPE "StaffMessageStatus" AS ENUM ('open', 'resolved');

CREATE TABLE "staff_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organisation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "ticket_id" UUID,
    "parent_id" UUID,
    "request_type" "StaffMessageRequestType" NOT NULL DEFAULT 'general',
    "subject" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "status" "StaffMessageStatus" NOT NULL DEFAULT 'open',
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_messages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "staff_messages" ADD CONSTRAINT "staff_messages_organisation_id_fkey"
  FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_messages" ADD CONSTRAINT "staff_messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_messages" ADD CONSTRAINT "staff_messages_ticket_id_fkey"
  FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff_messages" ADD CONSTRAINT "staff_messages_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "staff_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_messages" ADD CONSTRAINT "staff_messages_resolved_by_id_fkey"
  FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "staff_messages_organisation_id_status_created_at_idx"
  ON "staff_messages"("organisation_id", "status", "created_at" DESC);
CREATE INDEX "staff_messages_organisation_id_sender_id_idx"
  ON "staff_messages"("organisation_id", "sender_id");
CREATE INDEX "staff_messages_parent_id_idx" ON "staff_messages"("parent_id");
