const express = require("express");

const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");

const { createFaq, getFaqs } = require("../controllers/faqController");

router.post("/", protect, adminOnly, createFaq);

router.get("/", getFaqs);

module.exports = router;
