const express = require("express");

const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  createSupportTicket,
  getSupportTickets,
} = require("../controllers/supportController");

router.post("/", createSupportTicket);

router.get("/", protect, adminOnly, getSupportTickets);

module.exports = router;
