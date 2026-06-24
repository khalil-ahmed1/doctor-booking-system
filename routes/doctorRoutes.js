const express = require("express");
const { protect, doctorOnly } = require("../middleware/authMiddleware");
const router = express.Router();
const {
  registerDoctor,
  getAllDoctors,
  getDoctorById,
  updatePremiumSchedule,
  getPremiumSlots,
  getDoctorDashboard,
  getMyDashboard,
  updateHomeVisitStatus,
  getDoctorEarnings,
  getDoctorAnalytics,
    updateAvailability,
    searchDoctors,
} = require("../controllers/doctorController");

router.post("/register", registerDoctor);

// Dashboard (must come first)
router.get("/dashboard", protect, doctorOnly, getMyDashboard);
router.put(
  "/home-visit/:appointmentId",
  protect,
  doctorOnly,
  updateHomeVisitStatus,
);

// General routes
router.get("/analytics", protect, doctorOnly, getDoctorAnalytics);
router.get("/earnings", protect, doctorOnly, getDoctorEarnings);
router.put("/availability", protect, doctorOnly, updateAvailability);
router.get("/", getAllDoctors);

// Dynamic routes
router.get("/search", searchDoctors);
router.get("/:id", getDoctorById);

router.put("/:id/premium-schedule", updatePremiumSchedule);

router.get("/:id/premium-slots", getPremiumSlots);

router.get("/:id/dashboard", protect, doctorOnly, getDoctorDashboard);


module.exports = router;