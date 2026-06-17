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

    // Normal Appointment
    tokenNumber: {
      type: Number,
    },

    // Premium Appointment
    slotDate: {
      type: Date,
    },

    slotTime: {
      type: String,
    },

    // General Appointment Date
    appointmentDate: {
      type: Date,
      default: Date.now,
    },

    // Appointment Status
    status: {
      type: String,
      enum: [
        "booked",
        "checked",
        "cancelled",
        "missed",
        "rescheduled",
        "completed",
      ],
      default: "booked",
    },

    // Payment
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    amountPaid: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      default: "",
    },

    paymentId: {
      type: String,
      default: "",
    },

    // Ticket Number
    bookingReference: {
      type: String,
      unique: true,
      default: () => "BK" + Date.now() + Math.floor(Math.random() * 1000),
    },

    // Ticket Download
    ticketDownloaded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
