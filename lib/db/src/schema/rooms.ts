import { pgTable, serial, text, doublePrecision, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  label: text("label").notNull(),
  entryFee: doublePrecision("entry_fee").notNull(),
  winnerPrize: doublePrecision("winner_prize").notNull(),
  playerCount: integer("player_count").notNull().default(2),
  tagline: text("tagline").notNull().default(""),
  color: text("color").notNull().default("purple"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
