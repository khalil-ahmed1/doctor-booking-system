const Appointment = require("../models/Appointment");
const generateTicket = require("../utils/generateTicket");

const downloadTicket = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate("patientId", "name mobile email")
      .populate("doctorId", "name specialization clinicName");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    generateTicket(appointment, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  downloadTicket,
};
