-- Migrate demo user emails from stackfix.rw to stackfix.app
UPDATE "users" SET "email" = 'kevin@stackfix.app' WHERE "email" = 'kevin@stackfix.rw';
UPDATE "users" SET "email" = 'admin@stackfix.app' WHERE "email" = 'admin@stackfix.rw';
UPDATE "users" SET "email" = 'eric@stackfix.app' WHERE "email" = 'eric@stackfix.rw';
UPDATE "users" SET "role" = 'super_admin' WHERE "email" = 'kevin@stackfix.app';
