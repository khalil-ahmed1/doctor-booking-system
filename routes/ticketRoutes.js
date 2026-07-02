const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getTicket,
  downloadTicket,
} = require("../controllers/ticketController");
router.get("/download/:id", protect, downloadTicket);

router.get("/:id", protect, getTicket);

module.exports = router;
