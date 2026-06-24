const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    name: String,
    mobile: String,
    email: String,
    message: String,
    status: {
      type: String,
      default: "open",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Support", supportSchema);
