const Doctor = require("../models/Doctor");

const checkDoctorSubscription = async (doctor) => {
  if (!doctor) return null;

  if (
    doctor.subscriptionExpiryDate &&
    doctor.subscriptionExpiryDate < new Date() &&
    doctor.subscriptionStatus !== "expired"
  ) {
    doctor.subscriptionStatus = "expired";
    await doctor.save();
  }

  return doctor;
};

module.exports = checkDoctorSubscription;
