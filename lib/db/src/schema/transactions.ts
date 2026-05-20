import { pgTable, serial, integer, doublePrecision, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const depositsTable = pgTable("deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  amount: doublePrecision("amount").notNull(),
  trxId: text("trx_id").notNull(),
  method: text("method").notNull(), // bkash | nagad
  phone: text("phone").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const withdrawalsTable = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  amount: doublePrecision("amount").notNull(),
  method: text("method").notNull(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Deposit = typeof depositsTable.$inferSelect;
export type Withdrawal = typeof withdrawalsTable.$inferSelect;
