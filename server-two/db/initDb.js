const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function initDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL is not defined in server-two/.env");
    process.exit(1);
  }

  console.log(`Connecting to: ${connectionString.replace(/:[^:@]*@/, ":****@")}`);
  const pool = new Pool({ connectionString });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    console.log("Applying schema.sql to PostgreSQL database...");
    await pool.query(schemaSql);
    console.log("PostgreSQL Database Schema created successfully!");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDb();

