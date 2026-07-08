export interface SaveRecord {
  readonly createdAt: Date;

  readonly savedAt: Date;

  readonly unsavedAt: Date | null;
}

export function isActive(record: SaveRecord | null | undefined): boolean {
  return record != null && record.unsavedAt === null;
}

export interface Transition {
  readonly record: SaveRecord;
  readonly changed: boolean;
}

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

  return {
    record: { createdAt: existing.createdAt, savedAt: now, unsavedAt: null },
    changed: true,
  };
}

export function applyUnsave(
  existing: SaveRecord | null | undefined,
  now: Date,
): Transition {
  if (existing == null) {
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

export function deriveSavesCount(records: ReadonlyArray<SaveRecord>): number {
  return records.reduce((n, r) => (isActive(r) ? n + 1 : n), 0);
}
