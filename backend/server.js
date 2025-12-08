// // =============================
// //  SERVER.JS – FINAL FIXED FOR RENDER + VERCEL
// // =============================

// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const dotenv = require("dotenv");

// dotenv.config();

// const app = express();

// // =============================
// //  CORS CONFIG (FULL + CORRECTED)
// // =============================

// const allowedOrigins = [
//   "http://localhost:3000",
//   "http://localhost:3001",
//   "http://127.0.0.1:3000",
//   "http://127.0.0.1:3001",

//   // 🔥 VERY IMPORTANT: your Vercel URL
//   "https://found-it-mbu-portal.vercel.app",
// ];

// // Render must allow Vercel → Backend communication
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.log("🚫 BLOCKED ORIGIN:", origin);
//         callback(new Error("CORS Not Allowed"));
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//   })
// );

// app.options("*", cors());

// // =============================
// //  BODY PARSER
// // =============================
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ limit: "50mb", extended: true }));

// // =============================
// //  TEST ROUTE
// // =============================
// app.get("/api/auth/test", (req, res) => {
//   res.json({ ok: true, message: "Auth test route working!" });
// });

// // =============================
// //  DEBUG LOGGER
// // =============================
// app.use((req, res, next) => {
//   console.log(`📨 ${req.method} → ${req.originalUrl}`);
//   next();
// });

// // =============================
// //  ROOT
// // =============================
// app.get("/", (req, res) => {
//   res.json({ message: "Found-It API Running!", status: "active" });
// });

// // =============================
// //  ROUTES
// // =============================
// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/items", require("./routes/items"));
// app.use("/api/users", require("./routes/users"));
// app.use("/api/dashboard", require("./routes/dashboard"));
// app.use("/api", require("./routes/reports"));
// app.use("/api/claim", require("./routes/claim"));
// app.use("/api/admin", require("./routes/admin"));
// app.use("/api", require("./routes/notifications"));
// app.use("/api/otp", require("./routes/otp"));


// // =============================
// //  404 HANDLER
// // =============================
// app.use((req, res) => {
//   res.status(404).json({
//     error: "Not found",
//     path: req.originalUrl,
//   });
// });

// // =============================
// //  MongoDB
// // =============================
// const mongoURI =
//   process.env.MONGO_URI || "mongodb://127.0.0.1:27017/found-it-dev";

// mongoose
//   .connect(mongoURI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch((err) =>
//     console.error("❌ MongoDB Connection Error:", err.message)
//   );

// // =============================
// //  ERROR HANDLER
// // =============================
// app.use((err, req, res, next) => {
//   console.error("❌ SERVER ERROR:", err);
//   res.status(500).json({ error: err.message || "Server Error" });
// });

// // =============================
// //  START SERVER
// // =============================
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Backend running on port ${PORT}`);
// });


// =============================
//  SERVER.JS – FINAL FIXED FOR RENDER + VERCEL
// =============================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// =============================
//  CORS CONFIG (FULL + CORRECTED)
// =============================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://found-it-mbu-portal.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("🚫 BLOCKED ORIGIN:", origin);
        callback(new Error("CORS Not Allowed"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.options("*", cors());

// Body Parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Debug log
app.use((req, res, next) => {
  console.log(`📨 ${req.method} → ${req.originalUrl}`);
  next();
});

// Root
app.get("/", (req, res) => {
  res.json({ message: "Found-It API Running!", status: "active" });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/items", require("./routes/items"));
app.use("/api/users", require("./routes/users"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api", require("./routes/reports"));
app.use("/api/claim", require("./routes/claim"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", require("./routes/notifications"));

// ⭐ ADD THIS ⭐
// app.use("/api/otp", require("./routes/otp")); // Removed OTP

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

// MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
