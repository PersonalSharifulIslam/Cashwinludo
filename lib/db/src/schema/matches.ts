import { pgTable, text, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { roomsTable } from "./rooms";

export const matchesTable = pgTable("matches", {
  id: text("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => roomsTable.id),
  player1Id: integer("player1_id").notNull().references(() => usersTable.id),
  player2Id: integer("player2_id").references(() => usersTable.id),
  winnerId: integer("winner_id").references(() => usersTable.id),
  entryFee: doublePrecision("entry_fee").notNull(),
  prize: doublePrecision("prize").notNull(),
  status: text("status").notNull().default("searching"), // searching | matched | playing | completed | cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Match = typeof matchesTable.$inferSelect;
