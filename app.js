// app.js
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const apiRoutes = require("./routes/api");

const app = express();
const PORT = 3000;

// ✅ Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Use routes from api.js
app.use("/", apiRoutes);

// ❌ Fallback error page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "views", "error.html"));
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
