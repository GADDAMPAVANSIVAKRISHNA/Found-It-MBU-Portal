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
  const host = req.headers.host || 'unknown-host';
  const origin = req.headers.origin || 'no-origin';
  console.log(`📨 ${req.method} → ${req.originalUrl} [host=${host} origin=${origin}]`);
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
app.use("/api/connections", require("./routes/connectionRoutes"));
app.use("/api/chats", require("./routes/chatRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// Stats endpoints
app.use('/api/stats', require('./routes/stats'));

// ⭐ ADD THIS ⭐
// app.use("/api/otp", require("./routes/otp")); // Removed OTP

// 404
app.use((req, res) => {
  const payload = { error: "Not found", path: req.originalUrl };
  if (process.env.NODE_ENV !== 'production' && String(req.originalUrl || '').startsWith('/api')) {
    payload.message = 'API route not found. If you are developing locally, ensure the backend is running and that the frontend uses the correct BACKEND URL (VITE_API_URL or NEXT_PUBLIC_BACKEND_URL).';
  }
  res.status(404).json(payload);
});

// MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err.message));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT} (pid ${process.pid})`);
});

// Setup Socket.IO for real-time notifications
try {
  const { Server } = require('socket.io');
  const notificationHub = require('./utils/notificationHub');
  const admin = require('./firebase'); // firebase admin instance used for token verification
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', async (socket) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      let userId = null;

      if (token) {
        try {
          // Try Firebase token first (preferred)
          const decoded = await admin.auth().verifyIdToken(token);
          // Map firebase UID to app user _id
          const User = require('./models/user');
          const user = await User.findOne({ firebaseUid: decoded.uid });
          if (user) userId = user._id.toString();
        } catch (e) {
          // Try backend JWT fallback
          const jwt = require('jsonwebtoken');
          try {
            const decodedJwt = jwt.verify(token, process.env.JWT_SECRET);
            if (decodedJwt && decodedJwt.userId) userId = decodedJwt.userId;
          } catch (e2) {
            // invalid token
          }
        }
      }

      if (!userId) {
        socket.disconnect(true);
        return;
      }

      // Join a room for the user id so we can emit per-user
      socket.join(String(userId));

      // Optionally emit current unread count on connect
      notificationHub.emitUnreadCount(userId);

      socket.on('disconnect', () => {
        // Nothing special for now
      });
    } catch (err) {
      console.error('Socket connection error:', err && err.message);
    }
  });

  // Expose io to the notification hub
  notificationHub.init(io);

  console.log('🔌 Socket.IO initialized');
} catch (e) {
  console.warn('Socket.IO could not be initialized:', e && e.message);
}

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Kill the process using that port or change the PORT env variable.`);
    // Optionally show processes (Windows)
    try {
      const { execSync } = require('child_process');
      const out = execSync(`netstat -ano | findstr ":${PORT}"`).toString();
      console.error('\nProcesses listening on that port:\n', out);
    } catch (ex) {
      // ignore
    }
    process.exit(1);
  }

  console.error('❌ Server error:', err);
  process.exit(1);
});
