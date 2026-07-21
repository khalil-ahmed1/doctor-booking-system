// Load environment variables FIRST (Must be first line)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");

// Initialize Express App instance BEFORE using any middleware
const app = express();

app.use(helmet());
app.use(compression());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter Rate Limiting for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts from this IP, please try again after 15 minutes" }
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// Secure Production CORS Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://doctor-booking-frontend-alpha.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Other Middleware
app.use(
  express.json({
    limit: "10kb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Workaround for express-mongo-sanitize mutating req.query
app.use((req, res, next) => {
  if (req.query) {
    const q = req.query;
    Object.defineProperty(req, 'query', {
      value: q,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }
  next();
});

app.use(mongoSanitize());

// Database
const connectDB = require("./config/db");

// Routes
const supportRoutes = require("./routes/supportRoutes");
const faqRoutes = require("./routes/faqRoutes");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const patientRoutes = require("./routes/patientRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const emailRoutes = require("./routes/emailRoutes");

// Reminder Service
const { startReminderService } = require("./services/reminderService");

// Connect Database
connectDB();

// Home Route
app.get("/", (req, res) => {
  res.send("Doctor Booking API Running");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/faq", faqRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === 'ValidationError' || err.name === 'CastError') {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" && statusCode === 500 ? "Internal Server Error" : message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start Reminder Service AFTER server starts
  // Only run if the application is the primary instance
  if (process.env.NODE_APP_INSTANCE === '0' || !process.env.NODE_APP_INSTANCE) {
    startReminderService();
  }
});
