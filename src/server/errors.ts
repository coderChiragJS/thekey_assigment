/**
 * Typed application errors. The service/repo layer throws these; the route
 * handlers catch them and map to HTTP status codes. This keeps status-code
 * knowledge at the edge and lets the business layer speak in domain terms.
 */
export type ErrorCode =
  | "UNAUTHENTICATED" // 401
  | "FORBIDDEN" // 403
  | "NOT_FOUND" // 404
  | "BAD_REQUEST"; // 400

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
