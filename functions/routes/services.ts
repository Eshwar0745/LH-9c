import { Router } from "express";
import * as admin from "firebase-admin";

const router = Router();

// POST /api/services
router.post("/", async (req, res) => {
  try {
    // Validate provider ownership and input (add validation as needed)
    const { providerId, title, description, category, price, priceType, images, location, tags } = req.body;
    // ...add validation logic...
    const docRef = await admin.firestore().collection("services").add({
      providerId, title, description, category, price, priceType, images, location, tags,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true, data: { serviceId: docRef.id }, message: "Service created." });
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : String(err);
  res.status(500).json({ success: false, error: errorMsg });
  }
});

// GET /api/services
router.get("/", async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("services").where("isActive", "==", true).get();
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: services });
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : String(err);
  res.status(500).json({ success: false, error: errorMsg });
  }
});

// ...implement GET /:serviceId, PUT, DELETE, search, categories endpoints...

export default router;
