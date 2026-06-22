-- Ticket creator tracking and promote business owner

ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "created_by_user_id" UUID;

ALTER TABLE "tickets" DROP CONSTRAINT IF EXISTS "tickets_created_by_user_id_fkey";
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "tickets_organisation_id_created_by_user_id_idx"
  ON "tickets"("organisation_id", "created_by_user_id");

UPDATE "users" SET "role" = 'super_admin' WHERE "email" = 'kevin@stackfix.rw';

UPDATE "tickets" t
SET "created_by_user_id" = sub."changed_by_user_id"
FROM (
  SELECT DISTINCT ON (h."ticket_id")
    h."ticket_id",
    h."changed_by_user_id"
  FROM "ticket_status_history" h
  WHERE h."changed_by_user_id" IS NOT NULL
  ORDER BY h."ticket_id", h."created_at" ASC
) sub
WHERE t."id" = sub."ticket_id" AND t."created_by_user_id" IS NULL;
