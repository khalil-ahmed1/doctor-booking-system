const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const { downloadTicket } = require("../controllers/pdfController");

router.get("/ticket/:appointmentId", protect, downloadTicket);

module.exports = router;
