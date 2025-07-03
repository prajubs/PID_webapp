// routes/api.js
const express = require("express");
const path = require("path");
const router = express.Router();
const db = require("../db");

// --- Shared PID and system status memory ---
let currentPID = {
  kp: 10,
  ki: 0.1,
  kd: 8,
  setpoint: 180
};

let systemStatus = {
  temperature: 70.5,
  pidOutput: 82.3,
  triac: true
};

// ✅ Serve login and dashboard pages
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views", "login.html"));
});

router.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../views", "dashboard.html"));
});

// ✅ Login logic
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "1234") {
    res.redirect("/dashboard");
  } else {
    res.send("❌ Invalid login. <a href='/'>Try again</a>");
  }
});

// ✅ Frontend PID routes
router.get("/pid-values", (req, res) => {
  res.json(currentPID);
});

router.post("/pid", (req, res) => {
  const { kp, ki, kd, setpoint } = req.body;
  currentPID = { kp, ki, kd, setpoint };
  res.send("✅ PID updated");
});

// ✅ System status fetch and DB log
router.get("/status", (req, res) => {
  res.json(systemStatus);

  const { kp, ki, kd, setpoint } = currentPID;
  const { temperature, pidOutput, triac } = systemStatus;
  const triac_status = triac ? "ON" : "OFF";

  db.run(`
    INSERT INTO pid_logs (kp, ki, kd, setpoint, temperature, pid_output, triac_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [kp, ki, kd, setpoint, temperature, pidOutput, triac_status],
    (err) => {
      if (err) console.error("DB log error:", err.message);
    }
  );
});

// ✅ Export CSV route
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

router.get("/export", (req, res) => {
  const exportPath = path.join(__dirname, "../exports", "PID_Data_Export.csv");

  db.all("SELECT * FROM pid_logs ORDER BY timestamp DESC", (err, rows) => {
    if (err) return res.status(500).send("DB error");

    const csvWriter = createCsvWriter({
      path: exportPath,
      header: [
        { id: "id", title: "ID" },
        { id: "timestamp", title: "Timestamp" },
        { id: "kp", title: "Kp" },
        { id: "ki", title: "Ki" },
        { id: "kd", title: "Kd" },
        { id: "setpoint", title: "Setpoint" },
        { id: "temperature", title: "Temperature" },
        { id: "pid_output", title: "PID_Output" },
        { id: "triac_status", title: "TRIAC_Status" }
      ]
    });

    csvWriter.writeRecords(rows)
      .then(() => res.download(exportPath, "PID_Data_Export.csv"))
      .catch(() => res.status(500).send("CSV export error"));
  });
});


// ✅ ✅ ✅ ===> ESP32 ROUTES
// 📥 GET PID from server
router.get("/esp32/get-pid", (req, res) => {
  res.json(currentPID);
});

// 📤 POST temperature + output to server
router.post("/esp32/update-output", (req, res) => {
  const { temperature, output } = req.body;

  if (temperature !== undefined && output !== undefined) {
    systemStatus.temperature = parseFloat(temperature);
    systemStatus.pidOutput = parseFloat(output);

    console.log(`📡 ESP32 Update: Temp=${temperature}°C, Output=${output}%`);
    res.status(200).send("✅ Received by server");
  } else {
    res.status(400).send("❌ Invalid data");
  }
});

module.exports = router;
