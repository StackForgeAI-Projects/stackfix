-- Customer notifications: email channel + workshop bank transfer details

-- Add the email delivery channel for customer-facing notifications
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'email';

-- Bank transfer details shown on invoices and customer notifications
ALTER TABLE "organisations" ADD COLUMN IF NOT EXISTS "bank_name" VARCHAR(255);
ALTER TABLE "organisations" ADD COLUMN IF NOT EXISTS "bank_account_name" VARCHAR(255);
ALTER TABLE "organisations" ADD COLUMN IF NOT EXISTS "bank_account_number" VARCHAR(50);
