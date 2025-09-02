import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
}
