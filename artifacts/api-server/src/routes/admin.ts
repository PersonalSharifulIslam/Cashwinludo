import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, walletsTable, matchesTable, depositsTable, withdrawalsTable, settingsTable, roomsTable } from "@workspace/db";
import { eq, sql, count, sum } from "drizzle-orm";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../middlewares/auth";
import { formatUser } from "./auth";
import { formatRoom } from "./rooms";

const router = Router();

// Stats
router.get("/admin/stats", authMiddleware, adminMiddleware, async (req, res) => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [matchCount] = await db.select({ count: count() }).from(matchesTable);
  const [pendingDep] = await db.select({ count: count() }).from(depositsTable).where(eq(depositsTable.status, "pending"));
  const [pendingWith] = await db.select({ count: count() }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "pending"));
  const [activeMatch] = await db.select({ count: count() }).from(matchesTable).where(sql`${matchesTable.status} IN ('searching', 'matched', 'playing')`);
  const [totalDep] = await db.select({ total: sum(depositsTable.amount) }).from(depositsTable).where(eq(depositsTable.status, "approved"));
  const [totalWith] = await db.select({ total: sum(withdrawalsTable.amount) }).from(withdrawalsTable).where(eq(withdrawalsTable.status, "approved"));

  res.json({
    totalUsers: userCount.count,
    totalMatches: matchCount.count,
    pendingDeposits: pendingDep.count,
    pendingWithdrawals: pendingWith.count,
    totalRevenue: (parseFloat(String(totalDep.total || 0)) - parseFloat(String(totalWith.total || 0))) * 0.1,
    activeMatches: activeMatch.count,
    totalDeposited: parseFloat(String(totalDep.total || 0)),
    totalWithdrawn: parseFloat(String(totalWith.total || 0)),
  });
});

// Users
router.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await db.select().from(usersTable).orderBy(sql`${usersTable.createdAt} DESC`);
  res.json(users.map(formatUser));
});

router.patch("/admin/users/:id/ban", authMiddleware, adminMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { banned } = req.body;
  if (typeof banned !== "boolean") {
    res.status(400).json({ error: "banned field required (boolean)" });
    return;
  }
  const [user] = await db.update(usersTable).set({ banned }).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.patch("/admin/users/:id/balance", authMiddleware, adminMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { mainBalance, winningBalance, bonusBalance } = req.body;
  const [wallet] = await db.update(walletsTable)
    .set({ mainBalance, winningBalance, bonusBalance })
    .where(eq(walletsTable.userId, id))
    .returning();
  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }
  res.json({
    userId: wallet.userId,
    mainBalance: wallet.mainBalance,
    winningBalance: wallet.winningBalance,
    bonusBalance: wallet.bonusBalance,
    totalBalance: wallet.mainBalance + wallet.winningBalance + wallet.bonusBalance,
  });
});

// Rooms (admin)
router.post("/admin/rooms", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, label, entryFee, winnerPrize, tagline, color } = req.body;
  if (!name || !label || !entryFee || !winnerPrize) {
    res.status(400).json({ error: "All fields required" });
    return;
  }
  const [room] = await db.insert(roomsTable).values({
    name, label,
    entryFee: parseFloat(entryFee),
    winnerPrize: parseFloat(winnerPrize),
    tagline: tagline || "",
    color: color || "purple",
    active: true,
    playerCount: 2,
  }).returning();
  res.status(201).json(formatRoom(room));
});

router.patch("/admin/rooms/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, label, entryFee, winnerPrize, tagline, color, active } = req.body;
  const [room] = await db.update(roomsTable).set({
    ...(name !== undefined && { name }),
    ...(label !== undefined && { label }),
    ...(entryFee !== undefined && { entryFee: parseFloat(entryFee) }),
    ...(winnerPrize !== undefined && { winnerPrize: parseFloat(winnerPrize) }),
    ...(tagline !== undefined && { tagline }),
    ...(color !== undefined && { color }),
    ...(active !== undefined && { active }),
  }).where(eq(roomsTable.id, id)).returning();
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(formatRoom(room));
});

router.delete("/admin/rooms/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [room] = await db.update(roomsTable).set({ active: false }).where(eq(roomsTable.id, id)).returning();
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(formatRoom(room));
});

export default router;
