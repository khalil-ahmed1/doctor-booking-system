const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
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

    homeVisitFee: {
      type: Number,
      required: true,
    },

    homeVisitAvailable: {
      type: Boolean,
      default: false,
    },

    subscriptionStatus: {
      type: String,
      default: "inactive",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Doctor", doctorSchema);
