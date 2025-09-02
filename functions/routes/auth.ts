import { Router } from "express";
import * as admin from "firebase-admin";
import { registerSchema, loginSchema } from "../utils/validation";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  try {
    const userRecord = await admin.auth().createUser({
      email: value.email,
      password: value.password,
      displayName: value.name,
      phoneNumber: value.phone,
    });
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: value.email,
      name: value.name,
      phone: value.phone,
      role: value.role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: false,
      isActive: true,
      ...value.role === "provider" && {
        businessName: value.businessName,
        experience: value.experience,
        services: value.services,
        hourlyRate: value.hourlyRate,
        isVerified: false,
      }
    });
    const token = await admin.auth().createCustomToken(userRecord.uid);
    res.json({ success: true, data: { userId: userRecord.uid, token }, message: "Registration successful." });
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : String(err);
  res.status(500).json({ success: false, error: errorMsg });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  try {
    // Firebase Auth does not support password login from Admin SDK, use client SDK for login
    // Here, just fetch user and return profile for demo
    const user = await admin.auth().getUserByEmail(value.email);
    const userDoc = await admin.firestore().collection("users").doc(user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ success: false, error: "User not found" });
    const token = await admin.auth().createCustomToken(user.uid);
    res.json({ success: true, data: { user: userDoc.data(), token }, message: "Login successful." });
  } catch (err) {
  const errorMsg = err instanceof Error ? err.message : String(err);
  res.status(401).json({ success: false, error: errorMsg });
  }
});

// ...implement google-signin, logout, reset-password, verify-email endpoints...

export default router;
