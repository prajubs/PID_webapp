const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Path to the database file inside the data/ folder
const dbPath = path.join(__dirname, "data", "pid_data.db");

// Create and connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Failed to connect to SQLite DB:", err.message);
  } else {
    console.log("✅ Connected to SQLite database.");
  }
});

// Create table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS pid_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      kp REAL,
      ki REAL,
      kd REAL,
      setpoint REAL,
      temperature REAL,
      pid_output REAL,
      triac_status TEXT
    );
  `);
});

module.exports = db;
