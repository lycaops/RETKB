// CSV parsing, validation and field access utilities.

export const NUMERIC_FIELDS = [
  "TOTAL_NOOFACTIVATIONS",
  "TOTAL_TOPUP_LESS_6_PORTIN",
  "TOTAL_TOPUP_GREAT_6_PORTIN",
  "TOTAL_TOPUP_LESS_6",
  "TOTAL_TOPUP_GREAT_6",
  "BLOCKED_NOOFACTIVATIONS",
  "TOTAL_PORTOUT",
  "BUNDLE1_COMM",
  "QUALITY_BONUS M-1",
  "VOLUME_BONUS M-1",
  "PORTOUT DEDUCTION",
  "PORTIN_COMM",
  "ONBOARDING_COMM",
  "NONHP_COMM",
  "GARA_COMM",
  "USAGE_CLAWBACK",
  "USAGE_REFUND",
  "T3REN_BONUS",
  "TOTAL_COMM",
  "OPENING BALANCE",
  "TOTAL PAID (SBT+BT+VOU)",
  "NEW_ACT_CNT",
  "NEW_ACT_RENEWAL_CNT",
  "NEW ACTIVATIONS",
  "PORTIN_ACT_CNT",
  "PORTIN_ACT_RENEWAL_CNT",
  "PORT IN",
  "TOTAL_BUNDLE_ACT",
  "BUNDLE ACT NOT ELIGIBLE",
  "USAGE_PERCENTAGE",
  "RETAILER_COMM",
  "T1 BONUS",
  "T2 BONUS",
  "T1 RENEWAL",
  "T2 RENEWAL",
];

export const IDENTITY_FIELDS = ["RETAILER ID", "ACCMGRID", "HOTSPOTID"];
export const TEXT_FIELDS = ["MONTH", "PAYMENT MOOD", "INCENTIVE GROUP"];

function norm(s) {
  return String(s).toLowerCase().replace(/[\s_]+/g, "");
}

// Robust CSV parser handling quoted fields, embedded commas and newlines.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        if (row.some((c) => c.trim() !== "")) rows.push(row);
        row = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }

  if (rows.length === 0) return { headers: [], records: [] };

  const headers = rows[0].map((h) => h.trim());
  const records = rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] !== undefined ? r[idx] : "";
    });
    return obj;
  });

  return { headers, records };
}

// Access a field from a row by normalized name matching.
export function getField(row, field) {
  if (!row) return undefined;
  if (row[field] !== undefined) return row[field];
  const target = norm(field);
  for (const key of Object.keys(row)) {
    if (norm(key) === target) return row[key];
  }
  return undefined;
}

// Parse a numeric value safely; returns null for blank/invalid (never silently 0).
export function parseNumber(v) {
  if (v === undefined || v === null) return null;
  let s = String(v).trim();
  if (s === "" || s === "-") return null;
  s = s.replace(/[€$\s]/g, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return isNaN(n) ? null : n;
}

export function getNumber(row, field) {
  return parseNumber(getField(row, field));
}

export function getText(row, field) {
  const v = getField(row, field);
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

// Validate the parsed CSV structure.
export function validateCSV(headers, records) {
  const errors = [];
  const normalizedHeaders = headers.map(norm);
  if (!normalizedHeaders.includes(norm("RETAILER ID"))) {
    errors.push("Required column missing: RETAILER ID");
  }
  return { valid: errors.length === 0, errors };
}

export function formatCurrency(value, lang = "en") {
  if (value === null || value === undefined) return "—";
  const locale = lang === "it" ? "it-IT" : "en-GB";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value, lang = "en") {
  if (value === null || value === undefined) return "—";
  const locale = lang === "it" ? "it-IT" : "en-GB";
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(1)}%`;
}

// Normalize a usage/renewal percentage: values <= 1 are treated as fractions (0.2824 -> 28.24%).
export function normalizePercent(value) {
  if (value === null || value === undefined) return null;
  return value <= 1 ? value * 100 : value;
}