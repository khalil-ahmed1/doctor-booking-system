const express = require("express");

const router = express.Router();
const {
  registerDoctor,
  getAllDoctors,
  getDoctorById,
  updatePremiumSchedule,
  getPremiumSlots,
} = require("../controllers/doctorController");

router.post("/register", registerDoctor);

router.get("/", getAllDoctors);

router.get("/:id", getDoctorById);
router.put("/:id/premium-schedule", updatePremiumSchedule);
router.get("/:id/premium-slots", getPremiumSlots);

module.exports = router;
