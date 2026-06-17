const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    appointmentType: {
      type: String,
      enum: ["normal", "premium", "home"],
      required: true,
    },

    tokenNumber: {
      type: Number,
    },

    slotTime: {
      type: String,
    },

    appointmentDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["booked", "checked", "cancelled", "missed", "rescheduled"],
      default: "booked",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    amountPaid: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
