import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, settingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/referrals", authMiddleware, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const referred = await db.select().from(usersTable)
    .where(eq(usersTable.referredBy, user.referralCode))
    .orderBy(sql`${usersTable.createdAt} DESC`);

  const [bonusSetting] = await db.select().from(settingsTable).where(eq(settingsTable.key, "referral_bonus")).limit(1);
  const referralBonus = bonusSetting ? parseFloat(bonusSetting.value) : 20;

  res.json({
    referralCode: user.referralCode,
    referralBonus,
    totalReferred: referred.length,
    totalEarned: referred.length * referralBonus,
    referredUsers: referred.map(u => ({
      name: u.name,
      joinedAt: u.createdAt.toISOString(),
    })),
  });
});

export default router;
