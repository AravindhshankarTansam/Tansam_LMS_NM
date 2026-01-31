import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Decide environment
const NODE_ENV = process.env.NODE_ENV || "development";

// Only two files for your project
const envFile =
  NODE_ENV === "production"
    ? ".env.production"
    : ".env.local";

// Absolute path (important for PM2/scripts)
const envPath = path.resolve(process.cwd(), envFile);

// Check file exists
if (!fs.existsSync(envPath)) {
  console.error(`❌ Env file not found: ${envPath}`);
  process.exit(1);
}

// Load it ONCE
dotenv.config({
  path: envPath,
  override: true
});

console.log(`✅ Loaded environment from ${envFile}`);
