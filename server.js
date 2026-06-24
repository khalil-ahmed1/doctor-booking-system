// Load environment variables FIRST (Must be first line)
require("dotenv").config();

const express = require("express");
const cors = require("cors");

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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start Reminder Service AFTER server starts
  startReminderService();
});
