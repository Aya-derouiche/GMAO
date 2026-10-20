const { Pool } = require("pg");

const pool = new Pool();
pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  checkConnection: () => pool.query("SELECT 1"),
};
