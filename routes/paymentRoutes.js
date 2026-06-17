const express = require("express");

const router = express.Router();

const { protect, patientOnly } = require("../middleware/authMiddleware");

const { createOrder } = require("../controllers/paymentController");
const {
  verifyPayment,
} = require("../controllers/paymentController");

router.post("/create-order", protect, patientOnly, createOrder);
router.post("/verify", protect, patientOnly, verifyPayment);

module.exports = router;
