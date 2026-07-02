const mongoose = require("mongoose");

const doctorSubscriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    plan: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    orderId: {
      type: String,
      default: "",
    },

    paymentId: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    startDate: Date,

    expiryDate: Date,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("DoctorSubscription", doctorSubscriptionSchema);
