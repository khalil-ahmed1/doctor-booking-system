const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const { getTicket } = require("../controllers/ticketController");

router.get("/:id", protect, getTicket);

module.exports = router;
