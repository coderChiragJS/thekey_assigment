import { describe, expect, it } from "vitest";
import { formatPlural, selectPlural, type PluralForms } from "./plural";

const en: PluralForms = { one: "{count} save", other: "{count} saves" };
const es: PluralForms = { one: "{count} guardado", other: "{count} guardados" };

describe("selectPlural", () => {
  it("selects the 'one' category for 1 in English", () => {
    expect(selectPlural("en", 1, en)).toBe("{count} save");
  });

  it("selects the 'other' category for 0 and >1 in English", () => {
    expect(selectPlural("en", 0, en)).toBe("{count} saves");
    expect(selectPlural("en", 12, en)).toBe("{count} saves");
  });
});

describe("formatPlural", () => {
  it("interpolates the localized count (English)", () => {
    expect(formatPlural("en", 1, en)).toBe("1 save");
    expect(formatPlural("en", 12, en)).toBe("12 saves");
    expect(formatPlural("en", 0, en)).toBe("0 saves");
  });

  it("pluralizes correctly in Spanish", () => {
    expect(formatPlural("es", 1, es)).toBe("1 guardado");
    expect(formatPlural("es", 12, es)).toBe("12 guardados");
  });
});
