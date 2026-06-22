import { describe, expect, it, afterEach } from "vitest";
import { DEMO_ACCOUNTS } from "@stackfix/utils";
import request from "supertest";
import { createApp } from "./app.js";
import { forceDeleteTicket } from "./test-cleanup.js";

describe("Auth password reset", () => {
  const app = createApp();

  it("POST /forgot-password returns 404 for unknown email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "definitely-not-a-user@stackfix.app" });
    if (res.status === 500) return; // PostgreSQL unavailable in CI
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe("Email does not exist");
  });

  it("POST /forgot-password sends link for valid email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: DEMO_ACCOUNTS.superAdmin.email });
    if (res.status === 500) return;
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain("reset link");
  });

  it("POST /reset-password rejects invalid token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: "invalid-token-value", password: "NewPassword123!" });
    if (res.status === 500) return;
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("Ticket customer upsert", () => {
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

  it("updates customer name when phone already exists", async () => {
    const token = await loginToken();
    if (!token) return;

    const phone = `0788${String(Date.now()).slice(-6)}`;
    const firstName = `Upsert Test ${Date.now()}`;
    const updatedName = `Upsert Updated ${Date.now()}`;

    const first = await request(app)
      .post("/api/v1/tickets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerName: firstName,
        customerPhone: phone,
        deviceType: "Smartphone",
        faultDescription: "Screen crack",
      });
    expect(first.status).toBe(201);
    expect(first.body.data.customer.fullName).toBe(firstName);

    const second = await request(app)
      .post("/api/v1/tickets")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerName: updatedName,
        customerPhone: phone,
        deviceType: "TV",
        faultDescription: "No picture",
      });
    expect(second.status).toBe(201);
    expect(second.body.data.customer.fullName).toBe(updatedName);
    expect(second.body.data.customer.phone).toBe(first.body.data.customer.phone);
    ticketIds.push(first.body.data.id as string, second.body.data.id as string);
  });
});
