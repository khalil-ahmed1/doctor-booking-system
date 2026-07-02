const express = require("express");

const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const { getAdminDashboard } = require("../controllers/adminController");
const {
  getPendingDoctors,
    approveDoctor,
    suspendDoctor,
    activateSubscription,
    checkExpiredSubscriptions,
    getAllPatients,
    searchPatients,
    getPatientDetails,
    getAllDoctors,
    searchDoctors,
    getRevenueReport,
    getAllAppointments,
    approveRefund,
    createDoctorByAdmin,
} = require("../controllers/adminController");

router.get("/dashboard", protect, adminOnly, getAdminDashboard);
router.post("/create-doctor", protect, adminOnly, createDoctorByAdmin);
router.get("/pending-doctors", protect, adminOnly, getPendingDoctors);
router.put("/approve/:id", protect, adminOnly, approveDoctor);
router.put("/suspend/:id", protect, adminOnly, suspendDoctor);
router.post("/activate-subscription", protect, adminOnly, activateSubscription);
router.put("/check-expiry", protect, adminOnly, checkExpiredSubscriptions);
router.get("/patients", protect, adminOnly, getAllPatients);
router.get("/patients/search", protect, adminOnly, searchPatients);
router.get("/patients/:id", protect, adminOnly, getPatientDetails);
router.get("/doctors", protect, adminOnly, getAllDoctors);  
router.get("/doctors/search", protect, adminOnly, searchDoctors);
router.get("/revenue-report", protect, adminOnly, getRevenueReport);
router.get("/appointments", protect, adminOnly, getAllAppointments);
router.put("/refund/:id", protect, adminOnly, approveRefund);
module.exports = router;
