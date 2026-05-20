import { Router } from "express";
import { db } from "@workspace/db";
import { depositsTable, usersTable, walletsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

function formatDeposit(d: typeof depositsTable.$inferSelect, userName: string) {
  return {
    id: d.id,
    userId: d.userId,
    userName,
    amount: d.amount,
    trxId: d.trxId,
    method: d.method,
    phone: d.phone,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
  };
}

router.post("/deposits", authMiddleware, async (req: AuthRequest, res) => {
  const { amount, trxId, method, phone } = req.body;
  if (!amount || !trxId || !method || !phone) {
    res.status(400).json({ error: "All fields required" });
    return;
  }
  if (!["bkash", "nagad"].includes(method.toLowerCase())) {
    res.status(400).json({ error: "Method must be bkash or nagad" });
    return;
  }

  const [dep] = await db.insert(depositsTable).values({
    userId: req.userId!,
    amount: parseFloat(amount),
    trxId,
    method: method.toLowerCase(),
    phone,
    status: "pending",
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  res.status(201).json(formatDeposit(dep, user?.name || "Unknown"));
});

router.get("/deposits", authMiddleware, async (req: AuthRequest, res) => {
  const deposits = await db.select().from(depositsTable)
    .where(eq(depositsTable.userId, req.userId!))
    .orderBy(sql`${depositsTable.createdAt} DESC`);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  res.json(deposits.map(d => formatDeposit(d, user?.name || "Unknown")));
});

// Admin routes
router.get("/admin/deposits", authMiddleware, adminMiddleware, async (req, res) => {
  const deposits = await db.select().from(depositsTable).orderBy(sql`${depositsTable.createdAt} DESC`);
  const result = await Promise.all(deposits.map(async (d) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, d.userId)).limit(1);
    return formatDeposit(d, user?.name || "Unknown");
  }));
  res.json(result);
});

router.patch("/admin/deposits/:id/approve", authMiddleware, adminMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [dep] = await db.select().from(depositsTable).where(eq(depositsTable.id, id)).limit(1);
  if (!dep || dep.status !== "pending") {
    res.status(400).json({ error: "Deposit not found or already processed" });
    return;
  }
  const [updated] = await db.update(depositsTable).set({ status: "approved" }).where(eq(depositsTable.id, id)).returning();
  // Add to wallet
  await db.update(walletsTable).set({
    mainBalance: sql`main_balance + ${dep.amount}`,
  }).where(eq(walletsTable.userId, dep.userId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, dep.userId)).limit(1);
  res.json(formatDeposit(updated, user?.name || "Unknown"));
});

router.patch("/admin/deposits/:id/reject", authMiddleware, adminMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  const [dep] = await db.select().from(depositsTable).where(eq(depositsTable.id, id)).limit(1);
  if (!dep || dep.status !== "pending") {
    res.status(400).json({ error: "Deposit not found or already processed" });
    return;
  }
  const [updated] = await db.update(depositsTable).set({ status: "rejected" }).where(eq(depositsTable.id, id)).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, dep.userId)).limit(1);
  res.json(formatDeposit(updated, user?.name || "Unknown"));
});

export default router;
