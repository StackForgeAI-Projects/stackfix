/** StackFix product domain — used for emails, URLs, and demo accounts. */
export const STACKFIX_DOMAIN = "stackfix.app";

export const STACKFIX_URLS = {
  app: `https://app.${STACKFIX_DOMAIN}`,
  api: `https://api.${STACKFIX_DOMAIN}`,
  noreply: `noreply@${STACKFIX_DOMAIN}`,
  notifications: `notifications@${STACKFIX_DOMAIN}`,
} as const;

export const DEMO_ACCOUNTS = {
  superAdmin: { email: `kevin@${STACKFIX_DOMAIN}`, password: "StackFix2026!", role: "Super Admin" as const },
  admin: { email: `admin@${STACKFIX_DOMAIN}`, password: "Admin2026!", role: "Admin" as const },
  technician: { email: `eric@${STACKFIX_DOMAIN}`, password: "Tech2026!", role: "Technician" as const },
} as const;

/** All demo logins for the login page (includes role labels). */
export const DEMO_ACCOUNT_LIST = [
  DEMO_ACCOUNTS.superAdmin,
  DEMO_ACCOUNTS.admin,
  DEMO_ACCOUNTS.technician,
] as const;
