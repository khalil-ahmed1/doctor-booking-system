const express = require("express");
const { protect, doctorOnly } = require("../middleware/authMiddleware");
const router = express.Router();
const {
  registerDoctor,
  getAllDoctors,
  getDoctorById,
  updatePremiumSchedule,
  getPremiumSlots,
  getHomeVisitSlots,
  getDoctorDashboard,
  getMyDashboard,
  getAvailability,
  updateHomeVisitStatus,
  getDoctorEarnings,
  getDoctorAnalytics,
    updateAvailability,
    searchDoctors,
    getMyAppointments,
} = require("../controllers/doctorController");


// Dashboard (must come first)
router.get("/dashboard", protect, doctorOnly, getMyDashboard);
router.get("/my-appointments", protect, doctorOnly, getMyAppointments);
router.put(
  "/home-visit/:appointmentId",
  protect,
  doctorOnly,
  updateHomeVisitStatus,
);

// General routes
router.get("/analytics", protect, doctorOnly, getDoctorAnalytics);
router.get("/earnings", protect, doctorOnly, getDoctorEarnings);
router.get("/availability", protect, doctorOnly, getAvailability);
router.put("/availability", protect, doctorOnly, updateAvailability);
router.get("/", getAllDoctors);

// Dynamic routes
router.get("/search", searchDoctors);
router.get("/:id", getDoctorById);

router.put("/:id/premium-schedule", protect, doctorOnly, updatePremiumSchedule);

router.get("/:id/premium-slots", getPremiumSlots);
router.get("/:id/home-slots", getHomeVisitSlots);
router.get("/:id/dashboard", protect, doctorOnly, getDoctorDashboard);


module.exports = router;