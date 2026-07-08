/**
 * Pure business logic for the Saved-Posts feature.
 *
 * This module has NO database and NO I/O dependencies. It models the save /
 * un-save lifecycle as a state machine over a plain record, so idempotency,
 * reactivation, and count behaviour can be unit-tested without a database.
 *
 * The repository layer (src/server/repo.ts) calls these functions to decide
 * *what* to write, then performs the persistence separately.
 */

/** The minimal shape of a bookmark record the domain reasons about. */
export interface SaveRecord {
  /** First-ever save. Immutable — preserves history across re-saves. */
  readonly createdAt: Date;
  /** Updated on every (re-)save. Drives "most-recently-saved first". */
  readonly savedAt: Date;
  /** Soft-delete marker. `null` means the save is currently active. */
  readonly unsavedAt: Date | null;
}

/** A record is active (currently saved) iff it exists and is not soft-deleted. */
export function isActive(record: SaveRecord | null | undefined): boolean {
  return record != null && record.unsavedAt === null;
}

/**
 * The next state produced by a save/un-save transition.
 *
 *  - `changed: false` means the operation was a no-op (idempotent). Callers can
 *    skip the write entirely — the count and record are already correct.
 *  - `record` is the record that should exist afterwards. `null` is never
 *    returned here (un-save keeps the row via soft delete).
 */
export interface Transition {
  readonly record: SaveRecord;
  readonly changed: boolean;
}

/**
 * Apply a SAVE.
 *   none      -> create a new active record
 *   inactive  -> reactivate the SAME record (createdAt preserved), bump savedAt
 *   active    -> no-op (idempotent): saving twice never double-counts
 */
export function applySave(
  existing: SaveRecord | null | undefined,
  now: Date,
): Transition {
  if (existing == null) {
    return { record: { createdAt: now, savedAt: now, unsavedAt: null }, changed: true };
  }
  if (isActive(existing)) {
    return { record: existing, changed: false };
  }
  // Reactivate: keep original createdAt (history), refresh savedAt, clear delete.
  return {
    record: { createdAt: existing.createdAt, savedAt: now, unsavedAt: null },
    changed: true,
  };
}

/**
 * Apply an UN-SAVE (soft delete).
 *   active            -> mark unsavedAt (record preserved, not destroyed)
 *   none / inactive   -> no-op (idempotent)
 */
export function applyUnsave(
  existing: SaveRecord | null | undefined,
  now: Date,
): Transition {
  if (existing == null) {
    // Nothing to unsave; represent the absent-but-inactive state so callers
    // treating this uniformly still get a coherent record. No write needed.
    return {
      record: { createdAt: now, savedAt: now, unsavedAt: now },
      changed: false,
    };
  }
  if (!isActive(existing)) {
    return { record: existing, changed: false };
  }
  return {
    record: { createdAt: existing.createdAt, savedAt: existing.savedAt, unsavedAt: now },
    changed: true,
  };
}

/** Count of records that are currently active — the post's `savesCount`. */
export function deriveSavesCount(records: ReadonlyArray<SaveRecord>): number {
  return records.reduce((n, r) => (isActive(r) ? n + 1 : n), 0);
}
