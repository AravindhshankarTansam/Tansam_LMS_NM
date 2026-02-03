// ⭐⭐⭐ MUST BE FIRST — load env before ANYTHING
import "./config/dotenv.js";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import createAllRoutesCourse from "./routes/createAllRoutesCourse.js";
import mainstreamRoutes from "./routes/mainstreamRoutes.js";
import substreamRoutes from "./routes/substreamRoutes.js";
import nmSubscriptionRoutes from "./routes/nmSubscriptionRoutes.js";
import nmAccessRoutes from "./routes/nmAccessRoutes.js";
import nmPublishRoutes from "./routes/nmPublishRoutes.js";



// =====================================================
// __dirname fix (ES Modules)
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// =====================================================
// App Init
// =====================================================
const app = express();


// =====================================================
// Middlewares
// =====================================================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://lms.tansam.org"
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "600mb" }));
app.use(express.urlencoded({ limit: "600mb", extended: true }));
app.use(cookieParser());


// =====================================================
// Static files
// =====================================================
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// =====================================================
// Routes
// =====================================================
const API_BASE = process.env.API_BASE || "/api";

app.use(`${API_BASE}/admin`, adminRoutes);
app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/dashboard`, createAllRoutesCourse);
app.use(`${API_BASE}/mainstreams`, mainstreamRoutes);
app.use(`${API_BASE}/substreams`, substreamRoutes);
/* 🔥 NM INTEGRATION ROUTES */
app.use(API_BASE, nmSubscriptionRoutes);
app.use(API_BASE, nmAccessRoutes);
app.use(API_BASE, nmPublishRoutes);


// =====================================================
// Health check
// =====================================================
app.get("/", (req, res) => {
  res.send("🚀 LMS Backend is running successfully!");
});


// =====================================================
// Start Server ONLY after DB connects
// =====================================================
const startServer = async () => {
  try {
    await connectDB();

    console.log("✅ MySQL Database initialized successfully");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ MySQL Database initialization failed:", err.message);
    process.exit(1);
  }
};

startServer();
