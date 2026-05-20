import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, walletsTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, signToken, type AuthRequest } from "../middlewares/auth";

async function getWelcomeBonus(): Promise<number> {
  const [s] = await db.select().from(settingsTable).where(eq(settingsTable.key, "welcomeBonus")).limit(1);
  return s ? parseFloat(s.value) : 20;
}

async function getReferralBonus(): Promise<number> {
  const [s] = await db.select().from(settingsTable).where(eq(settingsTable.key, "referralBonus")).limit(1);
  return s ? parseFloat(s.value) : 20;
}

const ADMIN_EMAIL = "jakirulmd1088@gmail.com";
const ADMIN_PASSWORD_HASH_KEY = "admin_password_hash";

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    referralCode: user.referralCode,
    wins: user.wins,
    losses: user.losses,
    banned: user.banned,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
  };
}

const router = Router();

router.post("/auth/register", async (req, res) => {
  const { name, phone, password, referralCode } = req.body;
  if (!name || !phone || !password) {
    res.status(400).json({ error: "Name, phone and password required" });
    return;
  }
  const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Phone already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const refCode = generateReferralCode();

  const [user] = await db.insert(usersTable).values({
    name,
    phone,
    passwordHash,
    referralCode: refCode,
    referredBy: referralCode || null,
    banned: false,
    isAdmin: false,
    wins: 0,
    losses: 0,
  }).returning();

  const welcomeBonus = await getWelcomeBonus();
  const referralBonus = await getReferralBonus();
  const bonusAmount = welcomeBonus + (referralCode ? referralBonus : 0);

  await db.insert(walletsTable).values({
    userId: user.id,
    mainBalance: 0,
    winningBalance: 0,
    bonusBalance: bonusAmount,
  });

  const token = signToken(user.id, false);
  res.status(201).json({ token, user: formatUser(user) });
});

router.post("/auth/login", async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    res.status(400).json({ error: "Phone and password required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: "Account banned" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken(user.id, user.isAdmin);
  res.json({ token, user: formatUser(user) });
});

router.post("/auth/admin-login", async (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL)).limit(1);
  if (!admin) {
    res.status(403).json({ error: "Admin not found" });
    return;
  }
  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken(admin.id, true);
  res.json({ token, user: formatUser(admin) });
});

router.get("/auth/me", authMiddleware, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

export default router;
export { formatUser };
