// src/config/db.js
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// SINGLE GLOBAL POOL — created only once
let pool = null;

const createPool = async () => {
  if (pool) return pool; // Already exists → reuse it

  try {
    // Step 1: Temporary connection ONLY to create database (same as before)
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306,
    });

    await tempConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`
    );
    await tempConnection.end();

    // Step 2: Create the real pool (this replaces createConnection)
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,           // safe number
      queueLimit: 0,
      multipleStatements: true,
    });

    console.log("Connected to MySQL (pool):", process.env.DB_NAME);

    // Step 3: Run schema.sql exactly like before (only once)
    const schemaPath = path.resolve("./database/schema.sql");

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf8");
      const connection = await pool.getConnection(); // borrow one connection
      await connection.query(schema);
      connection.release(); // give it back to the pool
      console.log("Database schema initialized successfully.");
    } else {
      console.warn("schema.sql not found. Skipping initialization.");
    }

    return pool;

  } catch (err) {
    console.error("MySQL connection failed:", err.message);
    throw err;
  }
};

// This is the only function you use in your controllers
export const connectDB = async () => {
  return await createPool(); // always returns the same pool
};

export default connectDB;