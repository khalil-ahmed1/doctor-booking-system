const Appointment = require("../models/Appointment");

const getTicket = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name mobile email")
      .populate(
        "doctorId",
        "name specialization clinicName clinicAddress consultationFee premiumFee homeVisitFee",
      );
      if (appointment.paymentStatus !== "paid") {
        return res.status(400).json({
          success: false,
          message: "Payment not completed. Ticket unavailable.",
        });
      }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,

      ticket: {
        bookingReference: appointment.bookingReference,

        patient: appointment.patientId,

        doctor: appointment.doctorId,

        appointmentType: appointment.appointmentType,

        tokenNumber: appointment.tokenNumber,

        slotDate: appointment.slotDate,

        slotTime: appointment.slotTime,

        paymentStatus: appointment.paymentStatus,

        amountPaid: appointment.amountPaid,

        paymentId: appointment.paymentId,

        status: appointment.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getTicket,
};
