import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatMonth,
  getCurrentMonth,
} from "@/lib/format";

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-500)).toBe("-$500.00");
  });

  it("formats with specific currency", () => {
    const result = formatCurrency(100, "EUR");
    expect(result).toContain("100");
    expect(result).toContain("€");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatCurrency(10.999)).toBe("$11.00");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2026-03-15");
    expect(result).toBe("Mar 15, 2026");
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date(2026, 0, 1));
    expect(result).toBe("Jan 1, 2026");
  });
});

describe("formatDateShort", () => {
  it("formats without year", () => {
    const result = formatDateShort("2026-03-15");
    expect(result).toBe("Mar 15");
  });
});

describe("formatMonth", () => {
  it("formats YYYY-MM to full month name", () => {
    expect(formatMonth("2026-03")).toBe("March 2026");
  });

  it("formats January correctly", () => {
    expect(formatMonth("2026-01")).toBe("January 2026");
  });

  it("formats December correctly", () => {
    expect(formatMonth("2025-12")).toBe("December 2025");
  });
});

describe("getCurrentMonth", () => {
  it("returns YYYY-MM format", () => {
    const result = getCurrentMonth();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  it("pads single-digit months", () => {
    const result = getCurrentMonth();
    const month = result.split("-")[1];
    expect(month.length).toBe(2);
  });
});
