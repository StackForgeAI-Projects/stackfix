import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "@stackfix/types";
import { verifyAccessToken } from "../lib/jwt.js";
import { unauthorized, forbidden } from "../lib/errors.js";

export interface AuthContext {
  userId: string;
  organisationId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(unauthorized());
    return;
  }
  const token = header.slice(7);
  const payload = verifyAccessToken(token);
  req.auth = {
    userId: payload.sub,
    organisationId: payload.orgId,
    role: payload.role,
  };
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(unauthorized());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(forbidden());
      return;
    }
    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyAccessToken(header.slice(7));
      req.auth = {
        userId: payload.sub,
        organisationId: payload.orgId,
        role: payload.role,
      };
    } catch {
      // ignore
    }
  }
  next();
}
