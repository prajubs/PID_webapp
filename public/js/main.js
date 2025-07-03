// === Fetch Initial PID Values from Server ===
async function fetchInitialPID() {
    try {
      const res = await fetch("/pid-values");
      if (!res.ok) throw new Error("Failed to fetch PID values");
  
      const { kp, ki, kd, setpoint } = await res.json();
      document.getElementById("kp").value = kp;
      document.getElementById("ki").value = ki;
      document.getElementById("kd").value = kd;
      document.getElementById("setpoint").value = setpoint;
    } catch (err) {
      console.error("Error fetching initial PID:", err);
      alert("⚠️ Could not load current PID settings.");
    }
  }
  
  // === Submit Updated PID Values to Server ===
  document.getElementById("pidForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const kp = parseFloat(document.getElementById("kp").value);
    const ki = parseFloat(document.getElementById("ki").value);
    const kd = parseFloat(document.getElementById("kd").value);
    const setpoint = parseFloat(document.getElementById("setpoint").value);
  
    try {
      const res = await fetch("/pid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kp, ki, kd, setpoint })
      });
  
      if (res.ok) {
        alert("✅ PID values updated!");
      } else {
        alert("❌ Failed to update PID values.");
      }
    } catch (err) {
      console.error("PID Submit Error:", err);
      alert("❌ Error sending PID values.");
    }
  });
  
  // === Handle TRIAC Toggle Button ===
  document.getElementById("toggleTriac").addEventListener("click", async () => {
    try {
      const res = await fetch("/toggle-triac", { method: "POST" });
      const text = await res.text();
      alert(text);
    } catch (err) {
      console.error("TRIAC Toggle Error:", err);
      alert("❌ Error toggling TRIAC");
    }
  });
  
  // === Fetch Live Status & Update Dashboard ===
  async function fetchStatus() {
    try {
      const res = await fetch("/status");
      const data = await res.json();
  
      document.getElementById("temperature").textContent = data.temperature.toFixed(2);
      document.getElementById("pid-output").textContent = data.pidOutput.toFixed(2);
      document.getElementById("triac-status").textContent = data.triac ? "ON" : "OFF";
  
      // Update real-time chart
      updateChart(data.temperature, data.pidOutput);
    } catch (err) {
      console.error("Status Fetch Error:", err);
    }
  }
  
  // === Setup Chart.js ===
  const ctx = document.getElementById("pidChart").getContext("2d");
  const pidChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperature (°C)",
          data: [],
          borderColor: "red",
          fill: false
        },
        {
          label: "PID Output (%)",
          data: [],
          borderColor: "blue",
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: {
            display: true,
            text: "Sample #"
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Value"
          }
        }
      }
    }
  });
  
  let sampleIndex = 0;
  
  // === Real-time Chart Updater ===
  function updateChart(temp, output) {
    pidChart.data.labels.push(sampleIndex++);
    pidChart.data.datasets[0].data.push(temp);
    pidChart.data.datasets[1].data.push(output);
  
    // Limit to last 20 points
    if (pidChart.data.labels.length > 20) {
      pidChart.data.labels.shift();
      pidChart.data.datasets[0].data.shift();
      pidChart.data.datasets[1].data.shift();
    }
  
    pidChart.update();
  }
  
  // === Initialize Dashboard ===
  fetchInitialPID();
  fetchStatus();
  setInterval(fetchStatus, 1000);
  
