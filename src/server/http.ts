import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { error: { code: err.code, message: err.message } },
          { status: err.status },
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: { code: "BAD_REQUEST", message: "Invalid request", issues: err.issues } },
          { status: 400 },
        );
      }
      console.error("Unhandled route error:", err);
      return NextResponse.json(
        { error: { code: "INTERNAL", message: "Internal server error" } },
        { status: 500 },
      );
    }
  };
}

export function json<T>(body: T, status = 200): Response {
  return NextResponse.json(body, { status });
}
