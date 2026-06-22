-- CreateEnum
CREATE TYPE "UserNotificationType" AS ENUM (
  'message_new',
  'message_reply',
  'message_resolved',
  'ticket_status',
  'ticket_created',
  'invoice_created',
  'invoice_paid',
  'team_member',
  'system'
);

-- CreateTable
CREATE TABLE "user_notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organisation_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" "UserNotificationType" NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "body" TEXT NOT NULL,
  "href" VARCHAR(500),
  "read_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notifications_user_id_read_at_created_at_idx"
  ON "user_notifications"("user_id", "read_at", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_notifications"
  ADD CONSTRAINT "user_notifications_organisation_id_fkey"
  FOREIGN KEY ("organisation_id") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_notifications"
  ADD CONSTRAINT "user_notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
