const express = require("express");

const router = express.Router();

const {
  createNormalAppointment,
  createPremiumAppointment,
  createHomeVisitAppointment,
  getDoctorAppointments,
  markAppointmentChecked,
} = require("../controllers/appointmentController");

const { protect, patientOnly } = require("../middleware/authMiddleware");

// Test Route
router.get("/test", (req, res) => {
  res.send("Appointment Route Working");
});

// Patient Booking Routes
router.post("/normal", protect, patientOnly, createNormalAppointment);

router.post("/premium", protect, patientOnly, createPremiumAppointment);

router.post("/home", protect, patientOnly, createHomeVisitAppointment);

// Doctor Routes
router.get("/doctor/:doctorId", protect, getDoctorAppointments);

router.put("/:id/check", protect, markAppointmentChecked);

module.exports = router;
