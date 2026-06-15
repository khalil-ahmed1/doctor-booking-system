const Doctor = require("../models/Doctor");

const registerDoctor = async (req, res) => {
  try {
    const {
      name,
      specialization,
      qualification,
      experience,
      clinicName,
      clinicAddress,
      consultationFee,
      premiumFee,
      homeVisitFee,
      homeVisitAvailable,
    } = req.body;

    const doctor = await Doctor.create({
      name,
      specialization,
      qualification,
      experience,
      clinicName,
      clinicAddress,
      consultationFee,
      premiumFee,
      homeVisitFee,
      homeVisitAvailable,
    });

    res.status(201).json({
      success: true,
      message: "Doctor Registered Successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerDoctor,
};
