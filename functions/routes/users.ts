import { Router } from "express";
import * as admin from "firebase-admin";

const router = Router();

// GET /api/users/:userId
router.get("/:userId", async (req, res) => {
  try {
    const userDoc = await admin.firestore().collection("users").doc(req.params.userId).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: userDoc.data() });
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : String(err);
  res.status(500).json({ success: false, error: errorMsg });
  }
});

// PUT /api/users/:userId
router.put("/:userId", async (req, res) => {
  try {
    await admin.firestore().collection("users").doc(req.params.userId).update(req.body);
    res.json({ success: true, message: "Profile updated." });
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : String(err);
  res.status(500).json({ success: false, error: errorMsg });
  }
});

// ...implement upload-avatar, provider verify, provider availability endpoints...

export default router;
