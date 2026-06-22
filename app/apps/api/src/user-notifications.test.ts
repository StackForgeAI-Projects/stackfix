import { describe, expect, it, afterEach } from "vitest";
import { DEMO_ACCOUNTS } from "@stackfix/utils";
import request from "supertest";
import { createApp } from "./app.js";
import { deleteMessageThread } from "./test-cleanup.js";

describe("User notifications API", () => {
  const app = createApp();
  const threadIds: string[] = [];

  afterEach(async () => {
    for (const id of threadIds.splice(0)) {
      await deleteMessageThread(id);
    }
  });

  async function login(email: string, password: string) {
    const res = await request(app).post("/api/v1/auth/login").send({ email, password });
    if (res.status !== 200) return null;
    return res.body.data.accessToken as string;
  }

  it("lists notifications and marks as read", async () => {
    const techToken = await login(DEMO_ACCOUNTS.technician.email, DEMO_ACCOUNTS.technician.password);
    const adminToken = await login(DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password);
    if (!techToken || !adminToken) return;

    const created = await request(app)
      .post("/api/v1/messages")
      .set("Authorization", `Bearer ${techToken}`)
      .send({
        subject: "Notification test thread",
        body: "Please review this notification flow.",
        requestType: "general",
      });
    expect(created.status).toBe(201);
    threadIds.push(created.body.data.id as string);

    const list = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.unreadCount).toBeGreaterThan(0);
    expect(list.body.data.length).toBeGreaterThan(0);
    expect(list.body.pagination).toMatchObject({ page: 1, limit: 10 });

    const first = list.body.data[0];
    const read = await request(app)
      .patch(`/api/v1/notifications/${first.id}/read`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(read.status).toBe(200);
    expect(read.body.data.read).toBe(true);
  });

  it("filters by category and paginates", async () => {
    const techToken = await login(DEMO_ACCOUNTS.technician.email, DEMO_ACCOUNTS.technician.password);
    const adminToken = await login(DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password);
    if (!techToken || !adminToken) return;

    const created = await request(app)
      .post("/api/v1/messages")
      .set("Authorization", `Bearer ${techToken}`)
      .send({
        subject: "Notification test thread",
        body: "Category filter test.",
        requestType: "general",
      });
    expect(created.status).toBe(201);
    threadIds.push(created.body.data.id as string);

    const messages = await request(app)
      .get("/api/v1/notifications?category=messages&limit=5&page=1")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(messages.status).toBe(200);
    expect(messages.body.data.every((n: { type: string }) => n.type.startsWith("message_"))).toBe(true);

    const tickets = await request(app)
      .get("/api/v1/notifications?category=tickets")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(tickets.status).toBe(200);
    expect(
      tickets.body.data.every((n: { type: string }) =>
        ["ticket_status", "ticket_created"].includes(n.type),
      ),
    ).toBe(true);
  });
});
