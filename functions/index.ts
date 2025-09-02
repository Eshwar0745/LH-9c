import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

admin.initializeApp();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Import route modules
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import serviceRoutes from "./routes/services";
import bookingRoutes from "./routes/bookings";
import paymentRoutes from "./routes/payments";
import reviewRoutes from "./routes/reviews";
import chatRoutes from "./routes/chat";
import adminRoutes from "./routes/admin";
import notificationRoutes from "./routes/notifications";

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// Export as Cloud Function
exports.api = functions.https.onRequest(app);
