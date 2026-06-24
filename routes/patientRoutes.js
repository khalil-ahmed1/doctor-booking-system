const express = require("express");

const router = express.Router();

const { protect, patientOnly } = require("../middleware/authMiddleware");

const {
  getPatientDashboard,
  cancelAppointment,
  getMyAppointments,
} = require("../controllers/patientController");

// Patient Dashboard
router.get("/dashboard", protect, patientOnly, getPatientDashboard);

// My Appointments
router.get("/appointments", protect, patientOnly, getMyAppointments);

// Cancel Appointment
router.put("/appointment/:id/cancel", protect, patientOnly, cancelAppointment);

module.exports = router;
