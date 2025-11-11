
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import dotenv from "dotenv"; 

export const connectDB = async () => {
  try {
    
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

   
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true, 
    });

    console.log("✅ Connected to MySQL:", process.env.DB_NAME);

    const schemaPath = path.resolve("./database/schema.sql");

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf8");
      await connection.query(schema);
      console.log("✅ Database schema initialized successfully.");
    } else {
      console.warn("⚠️  schema.sql not found. Skipping initialization.");
    }

    return connection;
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    throw err;
  }
};
