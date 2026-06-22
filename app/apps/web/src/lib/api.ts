import type { AuthUser, UserNotificationItem, ActivityLogItem } from "@stackfix/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function formatApiError(error: unknown, fallback = "Request failed"): string {
  if (!(error instanceof ApiClientError)) {
    return error instanceof Error ? error.message : fallback;
  }
  if (error.code === "VALIDATION_ERROR" && error.details && typeof error.details === "object") {
    const fieldErrors = (error.details as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    if (fieldErrors) {
      const parts = Object.entries(fieldErrors).flatMap(([field, messages]) =>
        messages.map((message) => `${field}: ${message}`),
      );
      if (parts.length > 0) return parts.join(" · ");
    }
  }
  return error.message;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json();
  if (!res.ok || body.success === false) {
    throw new ApiClientError(
      body.error?.code ?? "API_ERROR",
      body.error?.message ?? "Request failed",
      res.status,
      body.error?.details,
    );
  }
  return body as T;
}

async function refreshAccessToken(): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const body = await parseResponse<{ success: true; data: { accessToken: string } }>(res);
  setAccessToken(body.data.accessToken);
  return body.data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (
    res.status === 401 &&
    retryOnUnauthorized &&
    !path.startsWith("/api/v1/auth/login") &&
    !path.startsWith("/api/v1/auth/refresh") &&
    !path.startsWith("/api/v1/auth/logout")
  ) {
    try {
      await refreshAccessToken();
      return apiFetch<T>(path, options, false);
    } catch {
      // fall through to parse original 401
    }
  }

  return parseResponse<T>(res);
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ success: true; data: { accessToken: string; user: AuthUser } }>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    ),
  logout: () => apiFetch("/api/v1/auth/logout", { method: "POST" }, false),
  me: () => apiFetch<{ success: true; data: AuthUser }>("/api/v1/auth/me"),
  refresh: () =>
    apiFetch<{ success: true; data: { accessToken: string } }>("/api/v1/auth/refresh", {
      method: "POST",
    }, false),
  dashboard: () =>
    apiFetch<{ success: true; data: Record<string, number> }>("/api/v1/analytics/dashboard"),
  notifications: (params?: { page?: number; limit?: number; category?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.category) q.set("category", params.category);
    const qs = q.toString();
    return apiFetch<{
      success: true;
      data: UserNotificationItem[];
      unreadCount: number;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/v1/notifications${qs ? `?${qs}` : ""}`);
  },
  notificationsUnreadCount: () =>
    apiFetch<{ success: true; data: { unreadCount: number } }>(
      "/api/v1/notifications/unread-count",
    ),
  markNotificationRead: (id: string) =>
    apiFetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    apiFetch("/api/v1/notifications/read-all", { method: "PATCH" }),
  activity: (params?: { page?: number; limit?: number; category?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.category) q.set("category", params.category);
    const qs = q.toString();
    return apiFetch<{
      success: true;
      data: ActivityLogItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/v1/activity${qs ? `?${qs}` : ""}`);
  },
  tickets: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch<{ success: true; data: unknown[]; pagination: unknown }>(
      `/api/v1/tickets${q ? `?${q}` : ""}`,
    );
  },
  ticket: (id: string) =>
    apiFetch<{ success: true; data: unknown }>(`/api/v1/tickets/${id}`),
  createTicket: (body: unknown) =>
    apiFetch("/api/v1/tickets", { method: "POST", body: JSON.stringify(body) }),
  updateTicketStatus: (id: string, status: string) =>
    apiFetch(`/api/v1/tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  invoices: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch<{ success: true; data: unknown[]; pagination: unknown }>(
      `/api/v1/invoices${q ? `?${q}` : ""}`,
    );
  },
  createInvoice: (body: unknown) =>
    apiFetch("/api/v1/invoices", { method: "POST", body: JSON.stringify(body) }),
  invoice: (id: string) =>
    apiFetch<{ success: true; data: unknown }>(`/api/v1/invoices/${id}`),
  sendInvoice: (id: string) =>
    apiFetch(`/api/v1/invoices/${id}/send`, { method: "POST" }),
  markInvoicePaid: (id: string, body?: { paymentMethod?: string; notes?: string }) =>
    apiFetch(`/api/v1/invoices/${id}/mark-paid`, {
      method: "POST",
      body: JSON.stringify(body ?? { paymentMethod: "cash" }),
    }),
  updateTicket: (id: string, body: unknown) =>
    apiFetch(`/api/v1/tickets/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTicket: (id: string) =>
    apiFetch(`/api/v1/tickets/${id}`, { method: "DELETE" }),
  deleteInvoice: (id: string) =>
    apiFetch(`/api/v1/invoices/${id}`, { method: "DELETE" }),
  updateInvoice: (id: string, body: unknown) =>
    apiFetch(`/api/v1/invoices/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  setUserAccess: (id: string, isActive: boolean) =>
    apiFetch(`/api/v1/users/${id}/access`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
  deleteUser: (id: string) => apiFetch(`/api/v1/users/${id}`, { method: "DELETE" }),
  updateUser: (id: string, body: unknown) =>
    apiFetch(`/api/v1/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  searchTickets: (q: string) =>
    apiFetch<{ success: true; data: unknown[] }>(`/api/v1/tickets/search?q=${encodeURIComponent(q)}`),
  addTicketNote: (ticketId: string, body: string) =>
    apiFetch(`/api/v1/tickets/${ticketId}/notes`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  payments: () =>
    apiFetch<{ success: true; data: unknown[]; pagination: unknown }>("/api/v1/payments"),
  users: () => apiFetch<{ success: true; data: unknown[] }>("/api/v1/users"),
  createUser: (body: unknown) =>
    apiFetch<{ success: true; data: { tempPassword?: string } }>(
      "/api/v1/users",
      { method: "POST", body: JSON.stringify(body) },
    ),
  org: () => apiFetch<{ success: true; data: unknown }>("/api/v1/org"),
  updateOrg: (body: unknown) =>
    apiFetch("/api/v1/org", { method: "PATCH", body: JSON.stringify(body) }),
  forgotPassword: (email: string) =>
    apiFetch<{ success: true; data: { message: string } }>(
      "/api/v1/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
      false,
    ),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ success: true; data: { message: string } }>(
      "/api/v1/auth/reset-password",
      { method: "POST", body: JSON.stringify({ token, password }) },
      false,
    ),
  messages: () =>
    apiFetch<{ success: true; data: unknown[]; openCount: number }>("/api/v1/messages"),
  message: (id: string) =>
    apiFetch<{ success: true; data: unknown }>(`/api/v1/messages/${id}`),
  createMessage: (body: {
    subject: string;
    body: string;
    requestType?: string;
    ticketId?: string;
  }) => apiFetch("/api/v1/messages", { method: "POST", body: JSON.stringify(body) }),
  replyMessage: (id: string, body: string) =>
    apiFetch(`/api/v1/messages/${id}/replies`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  resolveMessage: (id: string) =>
    apiFetch(`/api/v1/messages/${id}/resolve`, { method: "PATCH" }),
  messageTyping: (id: string) =>
    apiFetch(`/api/v1/messages/${id}/typing`, { method: "POST" }),
  messageTypers: (id: string) =>
    apiFetch<{ success: true; data: string[] }>(`/api/v1/messages/${id}/typing`),
};
