/**
 * Hand-maintained convenience layer on top of the generated ./database.types.
 *
 * Postgres has no native enum here — the status/role/etc. columns below are
 * plain `text` with a `check` constraint (see supabase/migrations), so the
 * generated types see them as plain `string`. These literal unions restate
 * the same constraints for the app layer, and the Row aliases splice them
 * back onto the generated Row shape. Keeping this out of database.types.ts
 * means that file stays byte-for-byte regeneratable.
 */
import type { Database } from "./database.types";

export type TransactionType = "sale" | "rent";
export type PropertyStatus = "draft" | "pending" | "published" | "rejected" | "archived";
export type UserRole = "user" | "admin";
export type Locale = "fr" | "ar" | "en";
export type ReportReason = "fraud" | "duplicate" | "sold" | "wrong_info" | "inappropriate" | "other";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

export type Profile = Omit<Row<"profiles">, "role" | "locale"> & {
  role: UserRole;
  locale: Locale;
};

export type Property = Omit<Row<"properties">, "status" | "transaction_type"> & {
  status: PropertyStatus;
  transaction_type: TransactionType;
};

export type Category = Row<"categories">;
export type Location = Row<"locations">;

export type Report = Omit<Row<"reports">, "reason" | "status"> & {
  reason: ReportReason;
  status: ReportStatus;
};
