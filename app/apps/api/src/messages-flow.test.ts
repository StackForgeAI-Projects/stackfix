import { describe, expect, it, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { DEMO_ACCOUNTS } from "@stackfix/utils";
import { deleteMessageThread } from "./test-cleanup.js";

describe("Staff messages API", () => {
  const app = createApp();
  const threadIds: string[] = [];

  afterEach(async () => {
    for (const id of threadIds.splice(0)) {
      await deleteMessageThread(id);
    }
  });

  async function loginToken(email: string, password: string): Promise<string | null> {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password });
    if (res.status !== 200) return null;
    return res.body.data.accessToken as string;
  }

  it("technician can create a message thread", async () => {
    const token = await loginToken(DEMO_ACCOUNTS.technician.email, DEMO_ACCOUNTS.technician.password);
    if (!token) return;

    const res = await request(app)
      .post("/api/v1/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({
        subject: "Need ticket edit approval",
        body: "Please allow me to update device model on TKT-0001.",
        requestType: "edit_ticket",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subject).toContain("edit");
    threadIds.push(res.body.data.id as string);
  });

  it("rejects invalid ticket reference with a clear error", async () => {
    const token = await loginToken(DEMO_ACCOUNTS.technician.email, DEMO_ACCOUNTS.technician.password);
    if (!token) return;

    const res = await request(app)
      .post("/api/v1/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({
        subject: "Testing",
        body: "Test message body",
        requestType: "edit_ticket",
        ticketId: "6783",
      });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain("No ticket found");
  });

  it("accepts ticket number instead of UUID", async () => {
    const token = await loginToken(DEMO_ACCOUNTS.technician.email, DEMO_ACCOUNTS.technician.password);
    if (!token) return;

    const tickets = await request(app)
      .get("/api/v1/tickets?limit=1")
      .set("Authorization", `Bearer ${token}`);
    if (tickets.status !== 200 || !tickets.body.data?.[0]?.ticketNumber) return;

    const ticketNumber = tickets.body.data[0].ticketNumber as string;

    const res = await request(app)
      .post("/api/v1/messages")
      .set("Authorization", `Bearer ${token}`)
      .send({
        subject: "Ticket ref test",
        body: "Linked to a ticket by number.",
        requestType: "edit_ticket",
        ticketId: ticketNumber,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.ticket?.ticketNumber).toBe(ticketNumber);
    threadIds.push(res.body.data.id as string);
  });

  it("admin can list and resolve messages", async () => {
    const techToken = await loginToken(DEMO_ACCOUNTS.technician.email, DEMO_ACCOUNTS.technician.password);
    const adminToken = await loginToken(DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password);
    if (!techToken || !adminToken) return;

    const created = await request(app)
      .post("/api/v1/messages")
      .set("Authorization", `Bearer ${techToken}`)
      .send({
        subject: "Delete request test",
        body: "Please delete duplicate ticket.",
        requestType: "delete_ticket",
      });
    expect(created.status).toBe(201);
    const threadId = created.body.data.id as string;
    threadIds.push(threadId);

    const list = await request(app)
      .get("/api/v1/messages")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.some((m: { id: string }) => m.id === threadId)).toBe(true);

    const resolved = await request(app)
      .patch(`/api/v1/messages/${threadId}/resolve`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.status).toBe("resolved");
  });
});
