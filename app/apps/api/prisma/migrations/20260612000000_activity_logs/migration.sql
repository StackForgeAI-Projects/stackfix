-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM (
  'login',
  'ticket_created',
  'ticket_updated',
  'ticket_status_changed',
  'ticket_deleted',
  'ticket_note_added',
  'invoice_created',
  'invoice_sent',
  'invoice_paid',
  'invoice_updated',
  'invoice_deleted',
  'user_created',
  'user_updated',
  'user_deleted',
  'user_access_changed',
  'org_updated',
  'message_sent',
  'message_replied',
  'message_resolved'
);

-- CreateTable
CREATE TABLE "activity_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organisation_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "action" "ActivityAction" NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "href" VARCHAR(500),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_logs_organisation_id_created_at_idx" ON "activity_logs"("organisation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activity_logs_organisation_id_user_id_idx" ON "activity_logs"("organisation_id", "user_id");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
