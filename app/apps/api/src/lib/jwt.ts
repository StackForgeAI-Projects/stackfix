import jwt from "jsonwebtoken";
import type { JwtPayload, UserRole } from "@stackfix/types";
import { AppError, unauthorized } from "./errors.js";

const ACCESS_TTL = "15m";
const REFRESH_TTL = "30d";

function getSecret(type: "access" | "refresh"): string {
  const key = type === "access" ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET;
  if (!key || key.length < 32) {
    throw new Error(`${type} JWT secret is not configured`);
  }
  return key;
}

export function signAccessToken(userId: string, orgId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, orgId, role, type: "access" } satisfies JwtPayload, getSecret("access"), {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(userId: string, orgId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, orgId, role, type: "refresh" } satisfies JwtPayload, getSecret("refresh"), {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, getSecret("access")) as JwtPayload;
    if (payload.type !== "access") throw unauthorized();
    return payload;
  } catch {
    throw unauthorized("Invalid or expired access token");
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, getSecret("refresh")) as JwtPayload;
    if (payload.type !== "refresh") throw unauthorized();
    return payload;
  } catch {
    throw unauthorized("Invalid or expired refresh token");
  }
}

export function hashToken(token: string): string {
  return jwt.sign({ token }, getSecret("refresh"), { expiresIn: REFRESH_TTL });
}

export class TokenError extends AppError {
  constructor(message: string) {
    super("TOKEN_ERROR", message, 401);
  }
}
