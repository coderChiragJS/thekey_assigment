import type { Role } from "@/db/schema";
import { unauthenticated } from "./errors";

/**
 * Faked authentication. Per the brief we do NOT build a login system; instead
 * the caller's identity is read from request headers (as a signed token or
 * session would provide in production). The *authorization* rules downstream
 * are enforced for real.
 */
export interface AuthContext {
  readonly userId: string;
  readonly role: Role;
}

export const USER_ID_HEADER = "x-user-id";
export const ROLE_HEADER = "x-role";

function isRole(value: string | null): value is Role {
  return value === "student" || value === "moderator";
}

/** Parse the auth context from headers, or `null` if absent/invalid. */
export function readAuthContext(headers: Headers): AuthContext | null {
  const userId = headers.get(USER_ID_HEADER);
  const role = headers.get(ROLE_HEADER);
  if (!userId || !isRole(role)) return null;
  return { userId, role };
}

/** Like {@link readAuthContext} but throws 401 when unauthenticated. */
export function requireAuth(headers: Headers): AuthContext {
  const ctx = readAuthContext(headers);
  if (!ctx) throw unauthenticated();
  return ctx;
}
