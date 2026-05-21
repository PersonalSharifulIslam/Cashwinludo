import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";

const router = Router();

const DEFAULT_SETTINGS = {
  telegramLink: "https://t.me/royalludo",
  referralBonus: "20",
  welcomeBonus: "20",
  withdrawalFee: "20",
  minWithdrawal: "100",
  minDeposit: "50",
};

async function getSettingsMap(): Promise<Record<string, string>> {
  const all = await db.select().from(settingsTable);
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const s of all) {
    map[s.key] = s.value;
  }
  return map;
}

function formatSettings(map: Record<string, string>) {
  return {
    telegramLink: map.telegramLink || DEFAULT_SETTINGS.telegramLink,
    referralBonus: parseFloat(map.referralBonus || DEFAULT_SETTINGS.referralBonus),
    welcomeBonus: parseFloat(map.welcomeBonus || DEFAULT_SETTINGS.welcomeBonus),
    withdrawalFee: parseFloat(map.withdrawalFee || DEFAULT_SETTINGS.withdrawalFee),
    minWithdrawal: parseFloat(map.minWithdrawal || DEFAULT_SETTINGS.minWithdrawal),
    minDeposit: parseFloat(map.minDeposit || DEFAULT_SETTINGS.minDeposit),
  };
}

router.get("/settings/telegram", async (_req, res) => {
  const map = await getSettingsMap();
  res.json(formatSettings(map));
});

router.get("/admin/settings", authMiddleware, adminMiddleware, async (_req, res) => {
  const map = await getSettingsMap();
  res.json(formatSettings(map));
});

router.patch("/admin/settings", authMiddleware, adminMiddleware, async (req, res) => {
  const { telegramLink, referralBonus, welcomeBonus, withdrawalFee, minWithdrawal, minDeposit } = req.body;

  const updates: [string, string][] = [];
  if (telegramLink !== undefined)  updates.push(["telegramLink",  telegramLink]);
  if (referralBonus !== undefined) updates.push(["referralBonus", String(referralBonus)]);
  if (welcomeBonus !== undefined)  updates.push(["welcomeBonus",  String(welcomeBonus)]);
  if (withdrawalFee !== undefined) updates.push(["withdrawalFee", String(withdrawalFee)]);
  if (minWithdrawal !== undefined) updates.push(["minWithdrawal", String(minWithdrawal)]);
  if (minDeposit !== undefined)    updates.push(["minDeposit",    String(minDeposit)]);

  for (const [key, value] of updates) {
    const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(settingsTable).set({ value }).where(eq(settingsTable.key, key));
    } else {
      await db.insert(settingsTable).values({ key, value });
    }
  }

  const map = await getSettingsMap();
  res.json(formatSettings(map));
});

export default router;
