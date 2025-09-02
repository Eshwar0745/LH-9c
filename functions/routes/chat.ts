import { Router } from "express";
import * as admin from "firebase-admin";

const router = Router();

// POST /api/chat/rooms
router.post("/rooms", async (req, res) => {
  try {
    const { customerId, providerId, bookingId } = req.body;
    // Check if room exists
    const roomsRef = admin.firestore().collection("chatRooms");
    const existing = await roomsRef.where("customerId", "==", customerId).where("providerId", "==", providerId).get();
    if (!existing.empty) {
      return res.json({ success: true, data: { roomId: existing.docs[0].id }, message: "Room already exists." });
    }
    const docRef = await roomsRef.add({ customerId, providerId, bookingId, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ success: true, data: { roomId: docRef.id }, message: "Chat room created." });
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : String(err);
  res.status(500).json({ success: false, error: errorMsg });
  }
});

// ...implement GET rooms/:userId, POST messages, GET messages/:roomId, PUT messages/:messageId/read...

export default router;
