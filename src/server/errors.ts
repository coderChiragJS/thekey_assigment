export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST";

const STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
  }
}

export const unauthenticated = (m = "Authentication required") =>
  new AppError("UNAUTHENTICATED", m);
export const forbidden = (m = "You do not have access to this resource") =>
  new AppError("FORBIDDEN", m);
export const notFound = (m = "Resource not found") =>
  new AppError("NOT_FOUND", m);
export const badRequest = (m = "Invalid request") =>
  new AppError("BAD_REQUEST", m);
