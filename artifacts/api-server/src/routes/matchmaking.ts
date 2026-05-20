import { Router } from "express";
import { db } from "@workspace/db";
import { matchesTable, roomsTable, walletsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

function genMatchId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
}

function formatMatch(match: typeof matchesTable.$inferSelect, player1Name: string, player2Name: string | null, winnerName: string | null, roomName: string) {
  return {
    id: match.id,
    roomId: match.roomId,
    roomName,
    player1Name,
    player2Name,
    winnerName,
    entryFee: match.entryFee,
    prize: match.prize,
    status: match.status,
    createdAt: match.createdAt.toISOString(),
  };
}

// Join matchmaking - deduct fee, find or create match
router.post("/matchmaking/join", authMiddleware, async (req: AuthRequest, res) => {
  const { roomId } = req.body;
  if (!roomId) {
    res.status(400).json({ error: "roomId required" });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId)).limit(1);
  if (!room || !room.active) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  // Check balance
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, req.userId!)).limit(1);
  const totalBal = (wallet?.mainBalance || 0) + (wallet?.winningBalance || 0) + (wallet?.bonusBalance || 0);
  if (totalBal < room.entryFee) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  // Deduct from wallet (main first, then winning, then bonus)
  let remaining = room.entryFee;
  let newMain = wallet.mainBalance;
  let newWinning = wallet.winningBalance;
  let newBonus = wallet.bonusBalance;

  if (newMain >= remaining) {
    newMain -= remaining;
    remaining = 0;
  } else {
    remaining -= newMain;
    newMain = 0;
  }
  if (remaining > 0 && newWinning >= remaining) {
    newWinning -= remaining;
    remaining = 0;
  } else if (remaining > 0) {
    remaining -= newWinning;
    newWinning = 0;
  }
  if (remaining > 0) {
    newBonus -= remaining;
    remaining = 0;
  }

  await db.update(walletsTable).set({ mainBalance: newMain, winningBalance: newWinning, bonusBalance: newBonus }).where(eq(walletsTable.userId, req.userId!));

  // Find an existing searching match for this room by another player
  const [existingMatch] = await db.select().from(matchesTable)
    .where(and(
      eq(matchesTable.roomId, roomId),
      eq(matchesTable.status, "searching"),
      sql`${matchesTable.player2Id} IS NULL`
    ))
    .limit(1);

  if (existingMatch && existingMatch.player1Id !== req.userId) {
    // Match found! Update with player2
    await db.update(matchesTable).set({
      player2Id: req.userId,
      status: "matched",
      updatedAt: new Date(),
    }).where(eq(matchesTable.id, existingMatch.id));

    const [p1] = await db.select().from(usersTable).where(eq(usersTable.id, existingMatch.player1Id)).limit(1);
    const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

    res.json({
      matchId: existingMatch.id,
      status: "matched",
      opponent: p1?.name || "Unknown",
      roomId,
      message: "Opponent found! Battle starting...",
    });
    return;
  }

  // Create new match in searching state
  const matchId = genMatchId();
  const platformFee = room.entryFee * 2 * 0.1;
  const prize = room.winnerPrize;

  await db.insert(matchesTable).values({
    id: matchId,
    roomId,
    player1Id: req.userId!,
    entryFee: room.entryFee,
    prize,
    status: "searching",
  });

  const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

  res.json({
    matchId,
    status: "searching",
    opponent: null,
    roomId,
    message: "Searching for opponent...",
  });
});

// Cancel matchmaking and refund
router.post("/matchmaking/cancel", authMiddleware, async (req: AuthRequest, res) => {
  const { matchId } = req.body;
  if (!matchId) {
    res.status(400).json({ error: "matchId required" });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  if (match.player1Id !== req.userId) {
    res.status(403).json({ error: "Not your match" });
    return;
  }
  if (match.status !== "searching") {
    res.status(400).json({ error: "Cannot cancel - match already started" });
    return;
  }

  // Refund
  await db.update(walletsTable).set({
    mainBalance: sql`main_balance + ${match.entryFee}`,
  }).where(eq(walletsTable.userId, req.userId!));

  await db.update(matchesTable).set({ status: "cancelled", updatedAt: new Date() }).where(eq(matchesTable.id, matchId));

  res.json({
    matchId,
    status: "cancelled",
    opponent: null,
    roomId: match.roomId,
    message: "No opponent found. Entry fee refunded.",
  });
});

// Get match status
router.get("/matchmaking/status/:matchId", authMiddleware, async (req: AuthRequest, res) => {
  const { matchId } = req.params;
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  let opponentName: string | null = null;
  if (match.player2Id) {
    const opponentId = match.player1Id === req.userId ? match.player2Id : match.player1Id;
    const [opp] = await db.select().from(usersTable).where(eq(usersTable.id, opponentId)).limit(1);
    opponentName = opp?.name || null;
  }

  res.json({
    matchId: match.id,
    status: match.status,
    opponent: opponentName,
    roomId: match.roomId,
    message: match.status === "matched" ? "Opponent found! Battle starting..." :
             match.status === "cancelled" ? "Match cancelled." :
             "Searching for opponent...",
  });
});

// Match history
router.get("/matches/history", authMiddleware, async (req: AuthRequest, res) => {
  const matches = await db.select().from(matchesTable)
    .where(sql`${matchesTable.player1Id} = ${req.userId} OR ${matchesTable.player2Id} = ${req.userId}`)
    .orderBy(sql`${matchesTable.createdAt} DESC`)
    .limit(50);

  const result = await Promise.all(matches.map(async (m) => {
    const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, m.roomId)).limit(1);
    const [p1] = await db.select().from(usersTable).where(eq(usersTable.id, m.player1Id)).limit(1);
    let p2Name: string | null = null;
    if (m.player2Id) {
      const [p2] = await db.select().from(usersTable).where(eq(usersTable.id, m.player2Id)).limit(1);
      p2Name = p2?.name || null;
    }
    let winnerName: string | null = null;
    if (m.winnerId) {
      const [w] = await db.select().from(usersTable).where(eq(usersTable.id, m.winnerId)).limit(1);
      winnerName = w?.name || null;
    }
    return formatMatch(m, p1?.name || "Unknown", p2Name, winnerName, room?.name || "Unknown");
  }));

  res.json(result);
});

export default router;
