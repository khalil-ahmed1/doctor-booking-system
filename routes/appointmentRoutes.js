const express = require("express");

const router = express.Router();

const {
  createNormalAppointment,
  createPremiumAppointment,
  createHomeVisitAppointment,
  getDoctorAppointments,
  markAppointmentChecked,
  cancelAppointment,
  getAppointmentTicket,
} = require("../controllers/appointmentController");

const { protect, patientOnly, doctorOnly } = require("../middleware/authMiddleware");

// Test Route
router.get("/test", (req, res) => {
  res.send("Appointment Route Working");
});

// Patient Booking Routes

router.post("/normal", protect, patientOnly, createNormalAppointment);

router.post("/premium", protect, patientOnly, createPremiumAppointment);

router.post("/home", protect, patientOnly, createHomeVisitAppointment);
router.get("/ticket/:id", protect, getAppointmentTicket);

// Doctor Routes
router.get("/doctor/:doctorId", protect, doctorOnly, getDoctorAppointments);

router.put("/:id/check", protect, doctorOnly, markAppointmentChecked);
router.put("/:id/cancel", protect, patientOnly, cancelAppointment);

module.exports = router;
