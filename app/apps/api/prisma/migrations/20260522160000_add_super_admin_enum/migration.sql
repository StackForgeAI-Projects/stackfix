-- Add super_admin enum value (must be in its own migration for PostgreSQL)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'super_admin';
