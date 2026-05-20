import { Router } from "express";
import { db } from "@workspace/db";
import { walletsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/wallet", authMiddleware, async (req: AuthRequest, res) => {
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, req.userId!)).limit(1);
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

export default router;
