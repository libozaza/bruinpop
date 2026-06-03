/**
 * Build a reliable ISO datetime from HTML date + time inputs.
 *
 * @param {string} date - YYYY-MM-DD from <input type="date">
 * @param {string} time - HH:MM or HH:MM:SS from <input type="time">
 * @returns {{ iso: string } | { error: string }}
 */
export function buildEventDateTime(date, time) {
  const datePart = String(date ?? "").trim();
  const timePart = String(time ?? "").trim();

  if (!datePart || !timePart) {
    return { error: "Date and time are required" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return { error: "Invalid date format" };
  }

  const timeMatch = timePart.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!timeMatch) {
    return { error: "Invalid time format" };
  }

  const hours = timeMatch[1].padStart(2, "0");
  const minutes = timeMatch[2];
  const seconds = timeMatch[3] ?? "00";

  const localIso = `${datePart}T${hours}:${minutes}:${seconds}`;
  const parsed = new Date(localIso);

  if (Number.isNaN(parsed.getTime())) {
    return { error: "Invalid date format" };
  }

  return { iso: parsed.toISOString() };
}

/**
 * @param {string|Date} value
 * @returns {Date | null}
 */
export function parseEventDateTime(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
