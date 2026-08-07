import { customType } from "drizzle-orm/sqlite-core";
import { DateTime } from "luxon";

/**
 * SQLite's `CURRENT_TIMESTAMP` writes "YYYY-MM-DD HH:MM:SS" in UTC with nothing
 * in the string to say so, and both `new Date(…)` and `Date.parse` read that
 * shape as *local* time — silently shifting every timestamp by the host's offset.
 *
 * Converting at the driver boundary means that's handled once: everything above
 * the schema receives a real `Date`, so there is no timestamp string left in the
 * codebase for anyone to misread.
 *
 * Luxon's `fromSQL` is built for exactly this format, and its `isValid` lets a
 * value we couldn't read arrive as absent instead of as an Invalid Date that
 * turns every later calculation into NaN.
 */
const utcSqlTimestamp = customType<{ data: Date | null; driverData: string }>({
  dataType: () => "text",
  fromDriver: (value) => {
    const parsed = DateTime.fromSQL(value, { zone: "utc" });
    return parsed.isValid ? parsed.toJSDate() : null;
  },
});

/**
 * Column *factories*, deliberately not shared column builders.
 *
 * Drizzle's modifiers (`.notNull()`, `.default()`, …) mutate the builder and
 * return the same instance, so one exported builder shared by several tables is
 * one mutable object shared by several tables: a modifier applied by whichever
 * table is evaluated first silently lands on every table built after it, and
 * which that is depends on import order. Calling a function hands each table a
 * builder of its own.
 */
export const CommonTableField = {
  createdAt: () => utcSqlTimestamp("created_at"),
};
