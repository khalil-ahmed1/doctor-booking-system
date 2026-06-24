const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  getMyNotifications,
  markAsRead,
} = require("../controllers/notificationController");

router.get("/", protect, getMyNotifications);

router.put("/:id/read", protect, markAsRead);

module.exports = router;
