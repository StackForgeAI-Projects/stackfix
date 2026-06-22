import type { UserRole } from "@stackfix/types";

export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

export function isManager(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canAccessFinancials(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canCreateTicket(_role: UserRole): boolean {
  return true;
}

export function canReadAllTickets(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canFilterTicketsByUser(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canUpdateTicketStatus(role: UserRole): boolean {
  return isManager(role) || role === "technician";
}

export function canEditTicket(role: UserRole): boolean {
  return isManager(role);
}

export function canDeleteTicket(role: UserRole): boolean {
  return role === "super_admin";
}

export function canCreateInvoice(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canEditInvoice(role: UserRole): boolean {
  return role === "super_admin";
}

export function canDeleteInvoice(role: UserRole): boolean {
  return role === "super_admin";
}

export function canMarkInvoicePaid(role: UserRole): boolean {
  return role === "super_admin";
}

export function canManageTeam(role: UserRole): boolean {
  return role === "super_admin";
}

export function canViewTeam(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canViewActivityLog(role: UserRole): boolean {
  return isSuperAdmin(role);
}

export function formatUserRole(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    technician: "Technician",
  };
  return labels[role];
}
