const express = require("express");

const router = express.Router();

const {
  createNormalAppointment,
  getDoctorAppointments,
  markAppointmentChecked,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/authMiddleware");

router.post("/normal", protect, createNormalAppointment);
router.get("/doctor/:doctorId", protect, getDoctorAppointments);

router.get("/test", (req, res) => {
  res.send("Appointment Route Working");
});
router.put("/:id/check", protect, markAppointmentChecked);

module.exports = router;
