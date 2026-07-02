const express = require("express");

const router = express.Router();

const {
  protect,
  patientOnly,
  doctorOnly,
} = require("../middleware/authMiddleware");

const { createOrder } = require("../controllers/paymentController");
const {
  verifyPayment,
  createSubscriptionOrder,
  verifySubscriptionPayment,
} = require("../controllers/paymentController");

router.post("/create-order", protect, patientOnly, createOrder);
router.post("/verify", protect, patientOnly, verifyPayment);
router.post(
  "/subscription/create-order",
  protect,
  doctorOnly,
  createSubscriptionOrder,
);

router.post(
  "/subscription/verify",
  protect,
  doctorOnly,
  verifySubscriptionPayment,
);
module.exports = router;
