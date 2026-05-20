import { Router } from "express";
import { db } from "@workspace/db";
import { withdrawalsTable, usersTable, walletsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

function formatWithdrawal(w: typeof withdrawalsTable.$inferSelect, userName: string) {
  return {
    id: w.id,
    userId: w.userId,
    userName,
    amount: w.amount,
    method: w.method,
    phone: w.phone,
    status: w.status,
    createdAt: w.createdAt.toISOString(),
  };
}

router.post("/withdrawals", authMiddleware, async (req: AuthRequest, res) => {
  const { amount, method, phone } = req.body;
  if (!amount || !method || !phone) {
    res.status(400).json({ error: "All fields required" });
    return;
  }
  if (!["bkash", "nagad"].includes(method.toLowerCase())) {
    res.status(400).json({ error: "Method must be bkash or nagad" });
    return;
  }

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, req.userId!)).limit(1);
  const totalBal = (wallet?.mainBalance || 0) + (wallet?.winningBalance || 0) + (wallet?.bonusBalance || 0);
  if (totalBal < parseFloat(amount)) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  // Deduct immediately from wallet
  let remaining = parseFloat(amount);
  let newMain = wallet.mainBalance;
  let newWinning = wallet.winningBalance;
  let newBonus = wallet.bonusBalance;

  if (newWinning >= remaining) {
    newWinning -= remaining;
    remaining = 0;
  } else {
    remaining -= newWinning;
    newWinning = 0;
  }
  if (remaining > 0 && newMain >= remaining) {
    newMain -= remaining;
    remaining = 0;
  } else if (remaining > 0) {
    remaining -= newMain;
    newMain = 0;
  }
  if (remaining > 0) {
    newBonus -= remaining;
  }

  await db.update(walletsTable).set({ mainBalance: newMain, winningBalance: newWinning, bonusBalance: newBonus })
    .where(eq(walletsTable.userId, req.userId!));

  const [w] = await db.insert(withdrawalsTable).values({
    userId: req.userId!,
    amount: parseFloat(amount),
    method: method.toLowerCase(),
    phone,
    status: "pending",
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  res.status(201).json(formatWithdrawal(w, user?.name || "Unknown"));
});

router.get("/withdrawals", authMiddleware, async (req: AuthRequest, res) => {
  const withdrawals = await db.select().from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, req.userId!))
    .orderBy(sql`${withdrawalsTable.createdAt} DESC`);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  res.json(withdrawals.map(w => formatWithdrawal(w, user?.name || "Unknown")));
});

// Admin routes
router.get("/admin/withdrawals", authMiddleware, adminMiddleware, async (req, res) => {
  const withdrawals = await db.select().from(withdrawalsTable).orderBy(sql`${withdrawalsTable.createdAt} DESC`);
  const result = await Promise.all(withdrawals.map(async (w) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId)).limit(1);
    return formatWithdrawal(w, user?.name || "Unknown");
  }));
  res.json(result);
});

router.patch("/admin/withdrawals/:id/approve", authMiddleware, adminMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [w] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id)).limit(1);
  if (!w || w.status !== "pending") {
    res.status(400).json({ error: "Withdrawal not found or already processed" });
    return;
  }
  const [updated] = await db.update(withdrawalsTable).set({ status: "approved" }).where(eq(withdrawalsTable.id, id)).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId)).limit(1);
  res.json(formatWithdrawal(updated, user?.name || "Unknown"));
});

router.patch("/admin/withdrawals/:id/reject", authMiddleware, adminMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [w] = await db.select().from(withdrawalsTable).where(eq(withdrawalsTable.id, id)).limit(1);
  if (!w || w.status !== "pending") {
    res.status(400).json({ error: "Withdrawal not found or already processed" });
    return;
  }
  // Refund on reject
  const [updated] = await db.update(withdrawalsTable).set({ status: "rejected" }).where(eq(withdrawalsTable.id, id)).returning();
  await db.update(walletsTable).set({
    mainBalance: sql`main_balance + ${w.amount}`,
  }).where(eq(walletsTable.userId, w.userId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, w.userId)).limit(1);
  res.json(formatWithdrawal(updated, user?.name || "Unknown"));
});

export default router;
