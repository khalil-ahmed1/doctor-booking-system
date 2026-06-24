const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

const getPatientDashboard = async (req, res) => {
  try {
    const patientId = req.user._id;

    const appointments = await Appointment.find({
      patientId,
    })
      .populate(
        "doctorId",
        "name specialization clinicName consultationFee premiumFee homeVisitFee",
      )
      .sort({
        appointmentDate: -1,
      });

    // Upcoming Appointments
    const upcoming = appointments.filter((a) =>
      ["pending_payment", "confirmed", "booked", "rescheduled"].includes(
        a.status,
      ),
    );

    // Completed Appointments
    const completed = appointments.filter((a) =>
      ["checked", "completed"].includes(a.status),
    );

    // Cancelled Appointments
    const cancelled = appointments.filter((a) =>
      ["cancelled", "cancelled_by_patient", "cancelled_by_doctor"].includes(
        a.status,
      ),
    );

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

    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot cancel this appointment",
      });
    }

    if (
      appointment.status === "cancelled_by_patient" ||
      appointment.status === "cancelled_by_doctor"
    ) {
      return res.status(400).json({
        success: false,
        message: "Appointment already cancelled",
      });
    }

    appointment.status = "cancelled_by_patient";
    appointment.cancelledAt = new Date();

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

const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientId: req.user._id,
    })
      .populate({
        path: "doctorId",
        select:
          "name specialization clinicName consultationFee premiumFee homeVisitFee",
      })
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
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
  getMyAppointments,
};
