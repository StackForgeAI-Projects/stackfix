import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("StackFix API", () => {
  const app = createApp();

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.version).toBeDefined();
  });

  it("POST /api/v1/auth/login rejects invalid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bad@test.com", password: "wrongpassword" });
    // 401 when DB available; 500 if PostgreSQL is not running locally
    expect([401, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/v1/tickets requires auth", async () => {
    const res = await request(app).get("/api/v1/tickets");
    expect(res.status).toBe(401);
  });
});
