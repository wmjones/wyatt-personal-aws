/**
 * Date utility functions for handling date conversions
 * between JavaScript Date objects and PostgreSQL date format
 */

/**
 * Converts a date value to PostgreSQL-compatible YYYY-MM-DD format
 * Handles multiple input formats:
 * - JavaScript Date objects
 * - Date strings with timezone info (e.g., "Wed Jan 01 2025 00:00:00 GMT+0000")
 * - ISO date strings (e.g., "2025-01-01T00:00:00.000Z")
 * - Already formatted date strings (e.g., "2025-01-01")
 *
 * @param dateValue - The date value to convert (can be string, Date, or null/undefined)
 * @returns Formatted date string in YYYY-MM-DD format or null
 */
export function toPostgresDate(dateValue: string | Date | null | undefined): string | null {
  if (!dateValue) {
    return null;
  }

  // If it's already a Date object, convert directly
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  // Convert to string to handle various formats
  const dateStr = String(dateValue);

  // Check if it's already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Check if it contains timezone indicators or looks like a Date string
  if (
    dateStr.includes('GMT') ||
    dateStr.includes('UTC') ||
    dateStr.includes('T') ||
    /\w{3} \w{3} \d{2} \d{4}/.test(dateStr) // Mon Jan 01 2025 format
  ) {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
    }
  }

  // Return the original string if we can't parse it
  // This allows the database to handle the error if it's invalid
  return dateStr;
}

/**
 * Converts an object's date fields to PostgreSQL format
 * Useful for converting filter objects before passing to database
 *
 * @param obj - Object containing date fields
 * @param dateFields - Array of field names that contain dates
 * @returns New object with converted date fields
 */
export function convertDateFields<T extends Record<string, unknown>>(
  obj: T,
  dateFields: string[]
): T {
  const result = { ...obj } as Record<string, unknown>;

  for (const field of dateFields) {
    if (result[field] !== undefined) {
      result[field] = toPostgresDate(result[field] as string | Date | null | undefined);
    }
  }

  return result as T;
}
