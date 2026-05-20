import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { matchesTable } from "./matches";
import { usersTable } from "./users";

export const gameStatesTable = pgTable("game_states", {
  id: serial("id").primaryKey(),
  matchId: text("match_id").notNull().references(() => matchesTable.id),
  redTokens: jsonb("red_tokens").notNull().default([-1,-1,-1,-1]),
  blueTokens: jsonb("blue_tokens").notNull().default([-1,-1,-1,-1]),
  currentTurn: text("current_turn").notNull().default("red"), // "red" | "blue"
  diceValue: integer("dice_value"), // null = not rolled yet
  turnStartedAt: timestamp("turn_started_at").notNull().defaultNow(),
  redSkips: integer("red_skips").notNull().default(0),
  blueSkips: integer("blue_skips").notNull().default(0),
  status: text("status").notNull().default("playing"), // "playing" | "finished"
  winnerId: integer("winner_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type GameState = typeof gameStatesTable.$inferSelect;
