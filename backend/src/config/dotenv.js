// src/config/dotenv.js
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Detect environment
const env = process.env.NODE_ENV || "development";

// Choose env file
const envFile =
  env === "production"
    ? ".env.production"
    : ".env.local";

// Absolute path
const envPath = path.resolve(process.cwd(), envFile);

// Load env with OVERRIDE (THIS IS THE KEY FIX)
if (fs.existsSync(envPath)) {
  dotenv.config({
    path: envPath,
    override: true, // ?? FORCE production values
  });
  console.log(`? Loaded environment from ${envFile}`);
} else {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
    override: true,
  });
  console.warn(`?? ${envFile} not found — fallback to .env`);
}

// Sanity check
if (!process.env.JWT_SECRET) {
  console.warn("?? Missing JWT_SECRET in environment file!");
}

export default dotenv;
