export type UserRole = "super_admin" | "admin" | "technician";

export type PaymentModel = "pay_before" | "pay_on_pickup";

export type OrganisationPlan = "starter" | "growth" | "enterprise";

export type Language = "en" | "rw" | "fr";

export type TicketStatus =
  | "pending"
  | "under_repair"
  | "completed"
  | "picked_up"
  | "cancelled";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "partially_paid"
  | "overdue"
  | "cancelled";

export type PaymentMethod = "momo_ussd" | "cash" | "card" | "other" | "airtel_money";

export type PaymentStatus = "pending" | "successful" | "failed" | "reversed";

export type NotificationChannel = "whatsapp" | "sms" | "email";

export type NotificationStatus = "pending" | "sent" | "delivered" | "failed";

export type LineItemType = "part" | "labour" | "diagnostic" | "other";

export type StatusChangeTrigger = "manual" | "system" | "payment_confirmation";

export type StaffMessageRequestType = "general" | "edit_ticket" | "delete_ticket";

export type StaffMessageStatus = "open" | "resolved";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiListSuccess<T> {
  success: true;
  data: T[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    total?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiListSuccess<T> | ApiError;

export interface AuthUser {
  id: string;
  organisationId: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export type UserNotificationType =
  | "message_new"
  | "message_reply"
  | "message_resolved"
  | "ticket_status"
  | "ticket_created"
  | "invoice_created"
  | "invoice_paid"
  | "team_member"
  | "system";

export interface UserNotificationItem {
  id: string;
  type: UserNotificationType;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export interface UserNotificationsResponse {
  data: UserNotificationItem[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ActivityAction =
  | "login"
  | "ticket_created"
  | "ticket_updated"
  | "ticket_status_changed"
  | "ticket_deleted"
  | "ticket_note_added"
  | "invoice_created"
  | "invoice_sent"
  | "invoice_paid"
  | "invoice_updated"
  | "invoice_deleted"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "user_access_changed"
  | "org_updated"
  | "message_sent"
  | "message_replied"
  | "message_resolved";

export interface ActivityLogItem {
  id: string;
  action: ActivityAction;
  metadata: Record<string, string | number | boolean | null>;
  href: string | null;
  createdAt: string;
  user: { id: string; fullName: string; role: UserRole };
}

export interface ActivityLogResponse {
  data: ActivityLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ActivityFeedType =
  | "payment_received"
  | "invoice_sent"
  | "invoice_paid"
  | "whatsapp_sent"
  | "sms_sent";

export interface ActivityFeedItem {
  id: string;
  type: ActivityFeedType;
  title: string;
  body: string;
  createdAt: string;
}

export interface ActivityFeedResponse {
  data: ActivityFeedItem[];
  unreadCount: number;
}

export interface JwtPayload {
  sub: string;
  orgId: string;
  role: UserRole;
  type: "access" | "refresh";
}
