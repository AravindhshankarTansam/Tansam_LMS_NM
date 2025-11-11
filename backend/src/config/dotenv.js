// config/env.js
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Detect environment (default = development)
const env = process.env.NODE_ENV || "development";

// Select correct .env file
const envFile = env === "production" ? ".env.production" : ".env.local";

// Resolve absolute path
const envPath = path.resolve(process.cwd(), envFile);

// Load the right .env file
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`✅ Loaded environment from ${envFile}`);
} else {
  console.warn(`⚠️  ${envFile} not found — falling back to default .env`);
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

// Optional sanity check
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  Missing JWT_SECRET in environment file!");
}

export default dotenv;
