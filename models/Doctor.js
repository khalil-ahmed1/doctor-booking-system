const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },

    specialization: {
      type: String,
      required: true,
    },

    qualification: {
      type: String,
      required: true,
    },

    experience: {
      type: Number,
      required: true,
    },

    clinicName: {
      type: String,
      required: true,
    },

    clinicAddress: {
      type: String,
      required: true,
    },

    consultationFee: {
      type: Number,
      required: true,
    },

    premiumFee: {
      type: Number,
      required: true,
    },
    premiumBookingEnabled: {
      type: Boolean,
      default: true,
    },
    premiumWorkingDays: {
      type: [String],
      default: [],
    },

    premiumSlotDuration: {
      type: Number,
      default: 20,
    },

    premiumClinicAddress: {
      type: String,
      default: "",
    },
    
    homeVisitFee: {
      type: Number,
      required: true,
    },

    homeVisitAvailable: {
      type: Boolean,
      default: false,
    },

    homeVisitWorkingDays: {
      type: [String],
      default: [],
    },

    homeVisitStartTime: {
      type: String,
      default: "16:00",
    },

    homeVisitEndTime: {
      type: String,
      default: "19:00",
    },

    homeVisitSlotDuration: {
      type: Number,
      default: 30,
    },

    homeVisitAddress: {
      type: String,
      default: "",
    },

    premiumStartTime: {
      type: String,
      default: "",
    },

    premiumEndTime: {
      type: String,
      default: "",
    },

    slotDuration: {
      type: Number,
      default: 20,
    },

    subscriptionStatus: {
      type: String,
      enum: ["inactive", "trial", "active", "expired", "suspended"],
      default: "inactive",
    },

    subscriptionPlan: {
      type: String,
      enum: ["none", "trial", "monthly", "quarterly", "yearly"],
      default: "none",
    },

    subscriptionStartDate: {
      type: Date,
    },

    subscriptionExpiryDate: {
      type: Date,
    },

    subscriptionAmount: {
      type: Number,
      default: 0,
    },
    // Doctor Availability

    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },

    clinicStartTime: {
      type: String,
      default: "09:00",
    },

    clinicEndTime: {
      type: String,
      default: "18:00",
    },

    lunchStart: {
      type: String,
      default: "13:00",
    },

    lunchEnd: {
      type: String,
      default: "14:00",
    },

    maxNormalAppointments: {
      type: Number,
      default: 50,
    },

    maxPremiumAppointments: {
      type: Number,
      default: 20,
    },

    maxHomeVisits: {
      type: Number,
      default: 5,
    },

    vacationMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Doctor", doctorSchema);
