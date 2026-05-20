import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable, usersTable } from "@workspace/db";
import { eq, or, isNull, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware, type AuthRequest } from "../middlewares/auth";

const router = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", authMiddleware, async (req: AuthRequest, res) => {
  const notifications = await db.select().from(notificationsTable)
    .where(or(
      eq(notificationsTable.userId, req.userId!),
      isNull(notificationsTable.userId)
    ))
    .orderBy(sql`${notificationsTable.createdAt} DESC`);
  res.json(notifications.map(formatNotification));
});

router.patch("/notifications/:id/read", authMiddleware, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(formatNotification(updated));
});

// Admin send notification
router.post("/admin/notifications", authMiddleware, adminMiddleware, async (req, res) => {
  const { userId, title, message } = req.body;
  if (!title || !message) {
    res.status(400).json({ error: "Title and message required" });
    return;
  }
  const [n] = await db.insert(notificationsTable).values({
    userId: userId || null,
    title,
    message,
    isRead: false,
  }).returning();
  res.status(201).json(formatNotification(n));
});

export default router;
