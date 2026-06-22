import { describe, expect, it, afterEach } from "vitest";
import { DEMO_ACCOUNTS } from "@stackfix/utils";
import request from "supertest";
import { createApp } from "./app.js";
import { forceDeleteTicket } from "./test-cleanup.js";

describe("Delete ticket & invoice", () => {
  const app = createApp();
  const ticketIds: string[] = [];

  afterEach(async () => {
    for (const id of ticketIds.splice(0)) {
      await forceDeleteTicket(id);
    }
  });

  async function loginToken(): Promise<string | null> {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: DEMO_ACCOUNTS.superAdmin.email, password: DEMO_ACCOUNTS.superAdmin.password });
    if (res.status !== 200) return null;
    return res.body.data.accessToken as string;
  }

  async function createTicket(token: string) {
    const phone = `0789${String(Date.now()).slice(-6)}`;
    return request(app)
      .post("/api/v1/tickets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerName: `Delete Test ${Date.now()}`,
        customerPhone: phone,
        deviceType: "Smartphone",
        faultDescription: "Delete flow test",
      });
  }

  async function createInvoice(token: string, ticketId: string) {
    return request(app)
      .post("/api/v1/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ticketId,
        lineItems: [
          { description: "Screen", quantity: 1, unitPrice: 50000, itemType: "part" },
          { description: "Labor", quantity: 1, unitPrice: 10000, itemType: "labour" },
        ],
      });
  }

  it("deletes an unpaid invoice", async () => {
    const token = await loginToken();
    if (!token) return;

    const ticketRes = await createTicket(token);
    expect(ticketRes.status).toBe(201);
    const ticketId = ticketRes.body.data.id as string;

    const invoiceRes = await createInvoice(token, ticketId);
    expect(invoiceRes.status).toBe(201);
    const invoiceId = invoiceRes.body.data.id as string;

    const del = await request(app)
      .delete(`/api/v1/invoices/${invoiceId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.data.deleted).toBe(true);

    const ticketCheck = await request(app)
      .get(`/api/v1/tickets/${ticketId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(ticketCheck.status).toBe(200);
    expect(ticketCheck.body.data.invoice).toBeNull();
    ticketIds.push(ticketId);
  });

  it("deletes a ticket and cascades unpaid invoice", async () => {
    const token = await loginToken();
    if (!token) return;

    const ticketRes = await createTicket(token);
    expect(ticketRes.status).toBe(201);
    const ticketId = ticketRes.body.data.id as string;

    const invoiceRes = await createInvoice(token, ticketId);
    expect(invoiceRes.status).toBe(201);

    const del = await request(app)
      .delete(`/api/v1/tickets/${ticketId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body.data.deleted).toBe(true);
    expect(del.body.data.invoiceDeleted).toBe(true);

    const gone = await request(app)
      .get(`/api/v1/tickets/${ticketId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(gone.status).toBe(404);
  });

  it("blocks deleting a ticket with a paid invoice", async () => {
    const token = await loginToken();
    if (!token) return;

    const ticketRes = await createTicket(token);
    expect(ticketRes.status).toBe(201);
    const ticketId = ticketRes.body.data.id as string;

    const invoiceRes = await createInvoice(token, ticketId);
    expect(invoiceRes.status).toBe(201);
    const invoiceId = invoiceRes.body.data.id as string;

    const paid = await request(app)
      .post(`/api/v1/invoices/${invoiceId}/mark-paid`)
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentMethod: "cash" });
    expect(paid.status).toBe(200);

    const del = await request(app)
      .delete(`/api/v1/tickets/${ticketId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(422);
    expect(del.body.error.message).toContain("paid invoice");
    ticketIds.push(ticketId);
  });
});
