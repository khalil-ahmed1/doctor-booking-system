const express = require("express");

const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const { getAdminDashboard } = require("../controllers/adminController");
const {
  getPendingDoctors,
    approveDoctor,
    suspendDoctor,
} = require("../controllers/adminController");

router.get("/dashboard", protect, adminOnly, getAdminDashboard);
router.get("/pending-doctors", protect, adminOnly, getPendingDoctors);
router.put("/approve/:id", protect, adminOnly, approveDoctor);
router.put("/suspend/:id", protect, adminOnly, suspendDoctor);

module.exports = router;
