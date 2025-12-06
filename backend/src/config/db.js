import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config(); // load .env variables

// ✅ Export the pool so it can be used in routes
export let pool;

export const connectDB = async () => {
  try {
    // Temporary connection to create DB if it doesn't exist
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

    // ✅ Create a pool for production usage
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,      // maximum 10 connections at a time
      queueLimit: 0,             // unlimited queued requests
      multipleStatements: true,  // to run schema.sql
    });

    console.log("✅ MySQL pool created for:", process.env.DB_NAME);

    // Initialize schema if schema.sql exists
    const schemaPath = path.resolve("./database/schema.sql");
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf8");
      const conn = await pool.getConnection(); // get a connection from the pool
      await conn.query(schema);
      conn.release(); // release back to pool
      console.log("✅ Database schema initialized successfully.");
    } else {
      console.warn("⚠️ schema.sql not found. Skipping initialization.");
    }

    return pool; // return the pool instead of single connection
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    throw err;
  }
};
