const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Faq", faqSchema);
