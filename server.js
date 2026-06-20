const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const ticketRoutes = require("./routes/ticketRoutes");

// Load environment variables FIRST
dotenv.config();

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const patientRoutes = require("./routes/patientRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const pdfRoutes = require("./routes/pdfRoutes");

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
// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
