import type { ApiError } from "@stackfix/types";

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON(): ApiError {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }
}

export function notFound(resource: string): AppError {
  return new AppError(`${resource.toUpperCase()}_NOT_FOUND`, `${resource} not found`, 404);
}

export function unauthorized(message = "Unauthenticated"): AppError {
  return new AppError("UNAUTHORIZED", message, 401);
}

export function forbidden(message = "Insufficient permissions"): AppError {
  return new AppError("FORBIDDEN", message, 403);
}

export function conflict(message: string): AppError {
  return new AppError("CONFLICT", message, 409);
}

export function businessRule(message: string): AppError {
  return new AppError("BUSINESS_RULE_VIOLATION", message, 422);
}

export function validationError(details: unknown): AppError {
  return new AppError("VALIDATION_ERROR", "Validation failed", 400, details);
}
