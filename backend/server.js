// =============================
//  SERVER.JS – FINAL & PERFECTED
// =============================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config(); // Load .env FIRST

const app = express();

// =============================
//  CORS CONFIG (FINAL & SAFE)
// =============================
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ],
    credentials: true,
  })
);

app.options("*", cors());

// =============================
//  BODY PARSER
// =============================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// =============================
//  🔥 TEST ROUTE (must be BEFORE route mounting)
// =============================
app.get("/api/auth/test", (req, res) => {
  res.json({ ok: true, message: "Auth test route working!" });
});

// =============================
//  DEBUG LOGGER
// =============================
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =============================
//  ROOT ROUTE (must be BEFORE 404 handler)
// =============================
app.get("/", (req, res) => {
  res.json({ message: "Found-It API Running!", status: "active" });
});

// =============================
//  ROUTES
// =============================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/items", require("./routes/items"));
app.use("/api/users", require("./routes/users"));
app.use("/api", require("./routes/reports"));
app.use("/api/claim", require("./routes/claim"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", require("./routes/notifications"));

// =============================
//  404 - Not Found (friendly JSON)
// =============================
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl
  });
});

// =============================
//  MONGO DB CONNECTION (FIXED)
// =============================
const mongoURI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/found-it-dev";

console.log(
  `🔧 Using MongoDB URI: ${process.env.MONGO_URI ? "[ENV]" : "[FALLBACK LOCAL]"}`
);

mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.warn(
      "⚠️ MongoDB Connection Warning (App will still run):",
      err.message
    );
  });

// =============================
//  ERROR HANDLER (must be LAST)
// =============================
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err && err.stack ? err.stack : err);
  res.status(500).json({ error: "Something went wrong!" });
});
/* eslint-enable no-unused-vars */

// =============================
//  START SERVER (with EADDRINUSE fallback)
// =============================
const desiredPort = parseInt(process.env.PORT || "5000", 10);

function start(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`⚠️ Port ${port} in use, attempting ${nextPort}...`);
      start(nextPort);
    } else {
      console.error("❌ Server failed to start:", err);
      process.exit(1);
    }
  });
}

start(desiredPort);
