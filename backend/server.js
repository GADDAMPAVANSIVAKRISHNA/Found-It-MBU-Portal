// =============================
//  SERVER.JS – FIXED & CLEANED
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
//  DEBUG LOGGER
// =============================
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
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
//  MONGO DB CONNECTION (FIXED)
// =============================
// Ensure we have a valid MongoDB URI. If not present, fall back to a local default
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/found-it-dev';

console.log(`🔧 Using MongoDB URI: ${process.env.MONGO_URI ? '[ENV]' : '[FALLBACK LOCAL]'}`);

if (!mongoURI) {
  console.error("❌ ERROR: MONGO_URI is missing in .env file");
  process.exit(1);
}

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
//  ROOT ROUTE
// =============================
app.get("/", (req, res) => {
  res.json({ message: "Found-It API Running!", status: "active" });
});

// =============================
//  ERROR HANDLER
// =============================
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// =============================
//  START SERVER (with EADDRINUSE fallback)
// =============================
const desiredPort = parseInt(process.env.PORT || '5000', 10);

function start(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      const next = port + 1;
      console.warn(`⚠️ Port ${port} in use, attempting ${next}...`);
      start(next);
    } else {
      console.error('❌ Server failed to start:', err);
      process.exit(1);
    }
  });
}

start(desiredPort);
