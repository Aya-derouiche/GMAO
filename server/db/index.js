const { Pool } = require("pg");

// DATABASE_URL supports hosted providers such as Neon. Keep PG* variables as
// a fallback for local PostgreSQL installations. TLS settings from the URL
// (for Neon, sslmode=require) are parsed by pg; do not disable certificate
// verification with rejectUnauthorized: false.
const databaseUrl = process.env.DATABASE_URL?.trim();

if (process.env.NODE_ENV === "production" && databaseUrl) {
  let sslMode;
  try {
    sslMode = new URL(databaseUrl).searchParams.get("sslmode");
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL");
  }

  if (!["require", "verify-ca", "verify-full"].includes(sslMode)) {
    throw new Error(
      "Production DATABASE_URL must include sslmode=require, verify-ca, or verify-full"
    );
  }
}

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in production");
}

if (process.env.NODE_ENV === "production" && !databaseUrl) {
  throw new Error("DATABASE_URL must be configured in production");
}

const pool = new Pool(databaseUrl ? { connectionString: databaseUrl } : {});
pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  checkConnection: () => pool.query("SELECT 1"),
};
