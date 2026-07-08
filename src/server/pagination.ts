/**
 * Opaque keyset cursors. We paginate by (timestamp, id) rather than OFFSET so
 * pages stay stable as rows are inserted/removed, and stay cheap at scale.
 */
export interface Cursor {
  readonly ts: number; // epoch ms of the sort column
  readonly id: string; // tiebreaker id
}

export function encodeCursor(ts: number, id: string): string {
  return Buffer.from(`${ts}:${id}`).toString("base64url");
}

export function decodeCursor(raw: string | null | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const sep = decoded.indexOf(":");
    if (sep < 0) return null;
    const ts = Number(decoded.slice(0, sep));
    const id = decoded.slice(sep + 1);
    if (!Number.isFinite(ts) || id.length === 0) return null;
    return { ts, id };
  } catch {
    return null;
  }
}

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

/** Clamp a requested page size into a sane range. */
export function clampLimit(requested: number | undefined): number {
  if (requested === undefined || !Number.isFinite(requested)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.trunc(requested), 1), MAX_LIMIT);
}
