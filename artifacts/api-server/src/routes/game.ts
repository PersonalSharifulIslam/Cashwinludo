import { Router } from "express";
import { db } from "@workspace/db";
import {
  matchesTable,
  gameStatesTable,
  walletsTable,
  usersTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();
const TURN_TIMEOUT_MS = 5000;
const MAX_SKIPS = 3;

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function hasAnyValidMove(tokens: number[], diceValue: number): boolean {
  for (const steps of tokens) {
    if (steps === 57) continue;
    if (steps === -1 && diceValue === 6) return true;
    if (steps >= 0 && steps < 57 && steps + diceValue <= 57) return true;
  }
  return false;
}

function applyCapture(
  myTokens: number[],
  myColor: "red" | "blue",
  oppTokens: number[],
  movedIdx: number
): number[] {
  const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
  const steps = myTokens[movedIdx];
  if (steps < 0 || steps >= 52) return oppTokens;
  const myAbsPos = myColor === "red" ? steps : (steps + 26) % 52;
  if (SAFE.has(myAbsPos)) return oppTokens;
  const result = [...oppTokens];
  for (let j = 0; j < 4; j++) {
    const oppSteps = result[j];
    if (oppSteps < 0 || oppSteps >= 52) continue;
    const oppColor = myColor === "red" ? "blue" : "red";
    const oppAbsPos = oppColor === "red" ? oppSteps : (oppSteps + 26) % 52;
    if (oppAbsPos === myAbsPos) result[j] = -1;
  }
  return result;
}

async function awardWinner(matchId: string, winnerId: number) {
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match || match.status === "completed") return;
  await db.update(walletsTable).set({
    winningBalance: sql`winning_balance + ${match.prize}`,
  }).where(eq(walletsTable.userId, winnerId));
  await db.update(matchesTable).set({
    status: "completed",
    winnerId,
    updatedAt: new Date(),
  }).where(eq(matchesTable.id, matchId));
}

// Start game
router.post("/game/:matchId/start", authMiddleware, async (req: AuthRequest, res) => {
  const matchId = req.params.matchId as string;
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  if (match.status !== "matched") {
    // If already playing, just return ok
    res.json({ ok: true }); return;
  }
  if (match.player1Id !== req.userId && match.player2Id !== req.userId) {
    res.status(403).json({ error: "Not your match" }); return;
  }

  const [existing] = await db.select().from(gameStatesTable).where(eq(gameStatesTable.matchId, matchId)).limit(1);
  if (!existing) {
    await db.insert(gameStatesTable).values({
      matchId,
      redTokens: ([-1, -1, -1, -1] as unknown) as null,
      blueTokens: ([-1, -1, -1, -1] as unknown) as null,
      currentTurn: "red",
      diceValue: null,
      turnStartedAt: new Date(),
      redSkips: 0,
      blueSkips: 0,
      status: "playing",
      winnerId: null,
    });
  }
  await db.update(matchesTable).set({ status: "playing", updatedAt: new Date() }).where(eq(matchesTable.id, matchId));
  res.json({ ok: true });
});

// Get game state
router.get("/game/:matchId/state", authMiddleware, async (req: AuthRequest, res) => {
  const matchId = req.params.matchId as string;
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  if (match.player1Id !== req.userId && match.player2Id !== req.userId) {
    res.status(403).json({ error: "Not your match" }); return;
  }

  const [game] = await db.select().from(gameStatesTable).where(eq(gameStatesTable.matchId, matchId)).limit(1);
  if (!game) { res.status(404).json({ error: "Game not started" }); return; }

  const [p1] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, match.player1Id)).limit(1);
  const [p2] = match.player2Id
    ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, match.player2Id)).limit(1)
    : [null];

  const myColor = match.player1Id === req.userId ? "red" : "blue";

  // Server-side auto-skip if timer has expired by more than 2s (safety net)
  const elapsed = Date.now() - new Date(game.turnStartedAt).getTime();
  if (game.status === "playing" && elapsed > TURN_TIMEOUT_MS + 2000) {
    const currentColor = game.currentTurn as "red" | "blue";
    const currentSkips = currentColor === "red" ? game.redSkips : game.blueSkips;
    const newSkips = currentSkips + 1;

    if (newSkips >= MAX_SKIPS) {
      const winnerId = currentColor === "red" ? match.player2Id! : match.player1Id;
      await db.update(gameStatesTable).set({ status: "finished", winnerId, updatedAt: new Date() })
        .where(eq(gameStatesTable.matchId, matchId));
      await awardWinner(matchId, winnerId);
    } else {
      const nextTurn = currentColor === "red" ? "blue" : "red";
      if (currentColor === "red") {
        await db.update(gameStatesTable).set({ currentTurn: nextTurn, diceValue: null, turnStartedAt: new Date(), redSkips: newSkips, updatedAt: new Date() })
          .where(eq(gameStatesTable.matchId, matchId));
      } else {
        await db.update(gameStatesTable).set({ currentTurn: nextTurn, diceValue: null, turnStartedAt: new Date(), blueSkips: newSkips, updatedAt: new Date() })
          .where(eq(gameStatesTable.matchId, matchId));
      }
    }
    const [refreshed] = await db.select().from(gameStatesTable).where(eq(gameStatesTable.matchId, matchId)).limit(1);
    res.json({
      game: refreshed,
      myColor,
      isMyTurn: refreshed.currentTurn === myColor,
      player1: { id: match.player1Id, name: p1?.name || "Player 1" },
      player2: { id: match.player2Id, name: p2?.name || "Player 2" },
      entryFee: match.entryFee,
      prize: match.prize,
      turnTimeoutMs: TURN_TIMEOUT_MS,
    });
    return;
  }

  res.json({
    game,
    myColor,
    isMyTurn: game.currentTurn === myColor,
    player1: { id: match.player1Id, name: p1?.name || "Player 1" },
    player2: { id: match.player2Id, name: p2?.name || "Player 2" },
    entryFee: match.entryFee,
    prize: match.prize,
    turnTimeoutMs: TURN_TIMEOUT_MS,
  });
});

// Roll dice
router.post("/game/:matchId/roll", authMiddleware, async (req: AuthRequest, res) => {
  const matchId = req.params.matchId as string;
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }

  const [game] = await db.select().from(gameStatesTable).where(eq(gameStatesTable.matchId, matchId)).limit(1);
  if (!game || game.status !== "playing") { res.status(400).json({ error: "Game not active" }); return; }

  const myColor: "red" | "blue" = match.player1Id === req.userId ? "red" : "blue";
  if (game.currentTurn !== myColor) { res.status(400).json({ error: "Not your turn" }); return; }
  if (game.diceValue !== null) { res.status(400).json({ error: "Dice already rolled" }); return; }

  const dice = rollDice();
  const myTokens = (myColor === "red" ? game.redTokens : game.blueTokens) as number[];
  const hasMove = hasAnyValidMove(myTokens, dice);

  if (!hasMove) {
    const currentSkips = myColor === "red" ? game.redSkips : game.blueSkips;
    const newSkips = currentSkips + 1;
    const nextTurn = myColor === "red" ? "blue" : "red";

    if (newSkips >= MAX_SKIPS) {
      const winnerId = myColor === "red" ? match.player2Id! : match.player1Id;
      await db.update(gameStatesTable).set({ diceValue: dice, status: "finished", winnerId, updatedAt: new Date() })
        .where(eq(gameStatesTable.matchId, matchId));
      await awardWinner(matchId, winnerId);
      res.json({ diceValue: dice, autoSkip: true, gameOver: true, winnerId });
    } else {
      if (myColor === "red") {
        await db.update(gameStatesTable).set({ diceValue: dice, currentTurn: nextTurn, turnStartedAt: new Date(), redSkips: newSkips, updatedAt: new Date() })
          .where(eq(gameStatesTable.matchId, matchId));
      } else {
        await db.update(gameStatesTable).set({ diceValue: dice, currentTurn: nextTurn, turnStartedAt: new Date(), blueSkips: newSkips, updatedAt: new Date() })
          .where(eq(gameStatesTable.matchId, matchId));
      }
      res.json({ diceValue: dice, autoSkip: true, skipCount: newSkips });
    }
    return;
  }

  if (myColor === "red") {
    await db.update(gameStatesTable).set({ diceValue: dice, redSkips: 0, updatedAt: new Date() })
      .where(eq(gameStatesTable.matchId, matchId));
  } else {
    await db.update(gameStatesTable).set({ diceValue: dice, blueSkips: 0, updatedAt: new Date() })
      .where(eq(gameStatesTable.matchId, matchId));
  }
  res.json({ diceValue: dice, autoSkip: false });
});

// Move token
router.post("/game/:matchId/move", authMiddleware, async (req: AuthRequest, res) => {
  const matchId = req.params.matchId as string;
  const { tokenIndex } = req.body;

  if (tokenIndex === undefined || tokenIndex < 0 || tokenIndex > 3) {
    res.status(400).json({ error: "Invalid token index" }); return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }

  const [game] = await db.select().from(gameStatesTable).where(eq(gameStatesTable.matchId, matchId)).limit(1);
  if (!game || game.status !== "playing") { res.status(400).json({ error: "Game not active" }); return; }

  const myColor: "red" | "blue" = match.player1Id === req.userId ? "red" : "blue";
  const oppColor: "red" | "blue" = myColor === "red" ? "blue" : "red";

  if (game.currentTurn !== myColor) { res.status(400).json({ error: "Not your turn" }); return; }
  if (game.diceValue === null) { res.status(400).json({ error: "Roll dice first" }); return; }

  const myTokens = [...((myColor === "red" ? game.redTokens : game.blueTokens) as number[])];
  const oppTokens = [...((myColor === "red" ? game.blueTokens : game.redTokens) as number[])];
  const diceValue = game.diceValue;
  const steps = myTokens[tokenIndex];

  if (steps === 57) { res.status(400).json({ error: "Token already done" }); return; }
  if (steps === -1 && diceValue !== 6) { res.status(400).json({ error: "Need 6 to exit home" }); return; }
  const newSteps = steps === -1 ? 0 : steps + diceValue;
  if (newSteps > 57) { res.status(400).json({ error: "Move would overshoot home" }); return; }

  myTokens[tokenIndex] = newSteps;
  const newOppTokens = applyCapture(myTokens, myColor, oppTokens, tokenIndex);
  const allDone = myTokens.every(t => t === 57);
  const nextTurn: "red" | "blue" = diceValue === 6 ? myColor : oppColor;

  if (allDone) {
    if (myColor === "red") {
      await db.update(gameStatesTable).set({
        redTokens: (myTokens as unknown) as null,
        blueTokens: (newOppTokens as unknown) as null,
        currentTurn: nextTurn, diceValue: null, turnStartedAt: new Date(),
        status: "finished", winnerId: req.userId!, updatedAt: new Date(),
      }).where(eq(gameStatesTable.matchId, matchId));
    } else {
      await db.update(gameStatesTable).set({
        blueTokens: (myTokens as unknown) as null,
        redTokens: (newOppTokens as unknown) as null,
        currentTurn: nextTurn, diceValue: null, turnStartedAt: new Date(),
        status: "finished", winnerId: req.userId!, updatedAt: new Date(),
      }).where(eq(gameStatesTable.matchId, matchId));
    }
    await awardWinner(matchId, req.userId!);
    res.json({ ok: true, gameOver: true, winnerId: req.userId });
    return;
  }

  if (myColor === "red") {
    await db.update(gameStatesTable).set({
      redTokens: (myTokens as unknown) as null,
      blueTokens: (newOppTokens as unknown) as null,
      currentTurn: nextTurn, diceValue: null, turnStartedAt: new Date(), updatedAt: new Date(),
    }).where(eq(gameStatesTable.matchId, matchId));
  } else {
    await db.update(gameStatesTable).set({
      blueTokens: (myTokens as unknown) as null,
      redTokens: (newOppTokens as unknown) as null,
      currentTurn: nextTurn, diceValue: null, turnStartedAt: new Date(), updatedAt: new Date(),
    }).where(eq(gameStatesTable.matchId, matchId));
  }
  res.json({ ok: true, gameOver: false });
});

// Skip turn (client calls when timer expires)
router.post("/game/:matchId/skip", authMiddleware, async (req: AuthRequest, res) => {
  const matchId = req.params.matchId as string;
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }

  const [game] = await db.select().from(gameStatesTable).where(eq(gameStatesTable.matchId, matchId)).limit(1);
  if (!game || game.status !== "playing") { res.json({ ok: true }); return; }

  const myColor: "red" | "blue" = match.player1Id === req.userId ? "red" : "blue";
  if (game.currentTurn !== myColor) { res.json({ ok: true }); return; }

  const elapsed = Date.now() - new Date(game.turnStartedAt).getTime();
  if (elapsed < TURN_TIMEOUT_MS) { res.status(400).json({ error: "Timer not expired yet" }); return; }

  const currentSkips = myColor === "red" ? game.redSkips : game.blueSkips;
  const newSkips = currentSkips + 1;

  if (newSkips >= MAX_SKIPS) {
    const winnerId = myColor === "red" ? match.player2Id! : match.player1Id;
    await db.update(gameStatesTable).set({ status: "finished", winnerId, updatedAt: new Date() })
      .where(eq(gameStatesTable.matchId, matchId));
    await awardWinner(matchId, winnerId);
    res.json({ ok: true, gameOver: true, winnerId });
    return;
  }

  const nextTurn = myColor === "red" ? "blue" : "red";
  if (myColor === "red") {
    await db.update(gameStatesTable).set({ currentTurn: nextTurn, diceValue: null, turnStartedAt: new Date(), redSkips: newSkips, updatedAt: new Date() })
      .where(eq(gameStatesTable.matchId, matchId));
  } else {
    await db.update(gameStatesTable).set({ currentTurn: nextTurn, diceValue: null, turnStartedAt: new Date(), blueSkips: newSkips, updatedAt: new Date() })
      .where(eq(gameStatesTable.matchId, matchId));
  }
  res.json({ ok: true, skipCount: newSkips });
});

// Forfeit
router.post("/game/:matchId/forfeit", authMiddleware, async (req: AuthRequest, res) => {
  const matchId = req.params.matchId as string;
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId)).limit(1);
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }

  if (match.player1Id !== req.userId && match.player2Id !== req.userId) {
    res.status(403).json({ error: "Not your match" }); return;
  }

  if (match.status === "completed" || match.status === "cancelled") {
    res.json({ ok: true }); return;
  }

  if (match.status === "playing") {
    const winnerId = match.player1Id === req.userId ? match.player2Id! : match.player1Id;
    const [game] = await db.select().from(gameStatesTable).where(eq(gameStatesTable.matchId, matchId)).limit(1);
    if (game && game.status === "playing") {
      await db.update(gameStatesTable).set({ status: "finished", winnerId, updatedAt: new Date() })
        .where(eq(gameStatesTable.matchId, matchId));
    }
    await awardWinner(matchId, winnerId);
    res.json({ ok: true, forfeited: true, winnerId });
    return;
  }

  if (match.status === "matched") {
    // Both players get refunded
    await db.update(walletsTable).set({ mainBalance: sql`main_balance + ${match.entryFee}` })
      .where(eq(walletsTable.userId, match.player1Id));
    if (match.player2Id) {
      await db.update(walletsTable).set({ mainBalance: sql`main_balance + ${match.entryFee}` })
        .where(eq(walletsTable.userId, match.player2Id));
    }
    await db.update(matchesTable).set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(matchesTable.id, matchId));
    res.json({ ok: true, refunded: true });
    return;
  }

  res.json({ ok: true });
});

// Match history
router.get("/matches/history", authMiddleware, async (req: AuthRequest, res) => {
  const matches = await db.select().from(matchesTable)
    .where(sql`${matchesTable.player1Id} = ${req.userId} OR ${matchesTable.player2Id} = ${req.userId}`)
    .orderBy(sql`${matchesTable.createdAt} DESC`)
    .limit(50);

  const result = await Promise.all(matches.map(async (m) => {
    const [p1] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, m.player1Id)).limit(1);
    let p2Name: string | null = null;
    if (m.player2Id) {
      const [p2] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, m.player2Id)).limit(1);
      p2Name = p2?.name || null;
    }
    let winnerName: string | null = null;
    if (m.winnerId) {
      const [w] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, m.winnerId)).limit(1);
      winnerName = w?.name || null;
    }
    return {
      id: m.id,
      player1Name: p1?.name || "Player 1",
      player2Name: p2Name,
      winnerName,
      entryFee: m.entryFee,
      prize: m.prize,
      status: m.status,
      result: m.winnerId === req.userId ? "win" : m.winnerId !== null ? "loss" : "pending",
      createdAt: m.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

export default router;
