import { Router } from "express";
import * as admin from "firebase-admin";

const router = Router();

// GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    // Example: count users, bookings, revenue
    const usersSnap = await admin.firestore().collection("users").get();
    const bookingsSnap = await admin.firestore().collection("bookings").get();
    // ...add revenue, analytics, etc.
    res.json({ success: true, data: {
      userCount: usersSnap.size,
      bookingCount: bookingsSnap.size,
      // ...add more metrics
    }});
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : String(err);
  res.status(500).json({ success: false, error: errorMsg });
  }
});

// ...implement users, verify, suspend, bookings, analytics endpoints...

export default router;
