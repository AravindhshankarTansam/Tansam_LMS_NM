import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "./config/dotenv.js";
import { connectDB } from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import createAllRoutesCourse from "./routes/createAllRoutesCourse.js";
import cookieParser from "cookie-parser"; // ✅ NEW

// ✅ Initialize database (MySQL)
(async () => {
  try {
    await connectDB();
    console.log("✅ MySQL Database initialized successfully");
  } catch (err) {
    console.error("❌ MySQL Database initialization failed:", err.message);
    process.exit(1); // Stop server if DB fails
  }
})();

// __dirname fix for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Middlewares
app.use(
  cors({
    origin: "http://localhost:5173", // ⚠️ Change if your frontend runs elsewhere
    credentials: "include", // ✅ Allow cookies
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // ✅ Parse cookies

// ✅ Static folder for uploaded materials
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ✅ Base API routes
app.use(`${process.env.API_BASE || "/api"}/admin`, adminRoutes);
app.use(`${process.env.API_BASE || "/api"}/auth`, authRoutes);

// ✅ Mount all LMS routes under /dashboard
app.use(`${process.env.API_BASE || "/api"}/dashboard`, createAllRoutesCourse);

// ✅ Root check
app.get("/", (req, res) => {
  res.send("🚀 LMS Backend is running successfully!");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
