import { Router } from "express";
import { db } from "@workspace/db";
import { roomsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function formatRoom(room: typeof roomsTable.$inferSelect) {
  return {
    id: room.id,
    name: room.name,
    label: room.label,
    entryFee: room.entryFee,
    winnerPrize: room.winnerPrize,
    playerCount: room.playerCount,
    tagline: room.tagline,
    color: room.color,
    active: room.active,
  };
}

router.get("/rooms", async (req, res) => {
  const rooms = await db.select().from(roomsTable).where(eq(roomsTable.active, true)).orderBy(roomsTable.entryFee);
  res.json(rooms.map(formatRoom));
});

router.get("/rooms/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, id)).limit(1);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(formatRoom(room));
});

export default router;
export { formatRoom };
