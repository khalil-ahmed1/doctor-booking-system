const Appointment = require("../models/Appointment");

const getPatientDashboard = async (req, res) => {
  try {
    const patientId = req.user._id;

    const appointments = await Appointment.find({
      patientId,
    })
      .populate(
        "doctorId",
        "name specialization clinicName consultationFee premiumFee",
      )
      .sort({
        appointmentDate: -1,
      });

    const upcoming = appointments.filter(
      (a) => a.status === "booked" || a.status === "rescheduled",
    );

    const completed = appointments.filter(
      (a) => a.status === "checked" || a.status === "completed",
    );

    const cancelled = appointments.filter((a) => a.status === "cancelled");

    res.status(200).json({
      success: true,

      statistics: {
        total: appointments.length,
        upcoming: upcoming.length,
        completed: completed.length,
        cancelled: cancelled.length,
      },

      upcoming,
      completed,
      cancelled,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Only the patient who booked it can cancel
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot cancel this appointment",
      });
    }

    // Only booked appointments can be cancelled
    if (appointment.status !== "booked") {
      return res.status(400).json({
        success: false,
        message: "Only booked appointments can be cancelled",
      });
    }

    appointment.status = "cancelled";

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  getPatientDashboard,
  cancelAppointment,
};
