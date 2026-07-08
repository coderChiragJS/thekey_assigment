import { describe, expect, it } from "vitest";
import {
  applySave,
  applyUnsave,
  deriveSavesCount,
  isActive,
  type SaveRecord,
} from "./saves";

const t0 = new Date("2025-01-01T00:00:00.000Z");
const t1 = new Date("2025-01-02T00:00:00.000Z");
const t2 = new Date("2025-01-03T00:00:00.000Z");

describe("applySave", () => {
  it("creates a new active record when none exists", () => {
    const { record, changed } = applySave(null, t0);
    expect(changed).toBe(true);
    expect(isActive(record)).toBe(true);
    expect(record.createdAt).toEqual(t0);
    expect(record.savedAt).toEqual(t0);
  });

  it("is idempotent: saving an already-active record is a no-op", () => {
    const active: SaveRecord = { createdAt: t0, savedAt: t0, unsavedAt: null };
    const { record, changed } = applySave(active, t1);
    expect(changed).toBe(false);
    expect(record).toBe(active);
  });

  it("reactivates an inactive record without creating a duplicate", () => {
    const inactive: SaveRecord = { createdAt: t0, savedAt: t0, unsavedAt: t1 };
    const { record, changed } = applySave(inactive, t2);
    expect(changed).toBe(true);
    expect(isActive(record)).toBe(true);
    expect(record.createdAt).toEqual(t0);
    expect(record.savedAt).toEqual(t2);
  });
});

describe("applyUnsave", () => {
  it("soft-deletes an active record (does not destroy it)", () => {
    const active: SaveRecord = { createdAt: t0, savedAt: t0, unsavedAt: null };
    const { record, changed } = applyUnsave(active, t1);
    expect(changed).toBe(true);
    expect(isActive(record)).toBe(false);
    expect(record.unsavedAt).toEqual(t1);
    expect(record.createdAt).toEqual(t0);
  });

  it("is idempotent: unsaving an inactive record is a no-op", () => {
    const inactive: SaveRecord = { createdAt: t0, savedAt: t0, unsavedAt: t1 };
    const { changed } = applyUnsave(inactive, t2);
    expect(changed).toBe(false);
  });

  it("is a no-op when there is nothing to unsave", () => {
    const { changed } = applyUnsave(null, t0);
    expect(changed).toBe(false);
  });
});

describe("save/unsave/re-save cycle", () => {
  it("preserves createdAt and never duplicates across a full cycle", () => {
    const created = applySave(null, t0).record;
    const unsaved = applyUnsave(created, t1).record;
    const resaved = applySave(unsaved, t2).record;

    expect(resaved.createdAt).toEqual(t0);
    expect(resaved.savedAt).toEqual(t2);
    expect(isActive(resaved)).toBe(true);
  });
});

describe("deriveSavesCount", () => {
  it("counts only active records", () => {
    const records: SaveRecord[] = [
      { createdAt: t0, savedAt: t0, unsavedAt: null },
      { createdAt: t0, savedAt: t0, unsavedAt: t1 },
      { createdAt: t0, savedAt: t0, unsavedAt: null },
    ];
    expect(deriveSavesCount(records)).toBe(2);
  });

  it("does not double-count an idempotent re-save", () => {
    let rec = applySave(null, t0).record;
    rec = applySave(rec, t1).record;
    expect(deriveSavesCount([rec])).toBe(1);
  });
});
