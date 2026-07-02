const Appointment = require("../models/Appointment");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
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
const downloadTicket = async (req, res) => {
  try {
  const appointment = await Appointment.findById(req.params.id)
    .populate("patientId", "name mobile email")
    .populate(
      "doctorId",
      "name specialization clinicName clinicAddress consultationFee premiumFee homeVisitFee",
    );

  console.log("DOWNLOAD API HIT");
  console.log("Payment Status:", appointment?.paymentStatus);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed.",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Ticket-${appointment.bookingReference}.pdf`,
    );

    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // ===== Header =====

    doc.fontSize(28).fillColor("#2563EB").text("SehatRaj", {
      align: "center",
    });

    doc
      .fontSize(13)
      .fillColor("gray")
      .text("by Qurenix Technologies Pvt. Ltd.", {
        align: "center",
      });

    doc.moveDown();

    doc.fontSize(18).fillColor("green").text("APPOINTMENT CONFIRMED", {
      align: "center",
    });

    doc.moveDown(2);

    // ===== Ticket Details =====

    doc.fontSize(14).fillColor("black");

    doc.text(`Booking Reference : ${appointment.bookingReference}`);
    doc.text(`Patient : ${appointment.patientId.name}`);
    doc.text(`Doctor : ${appointment.doctorId.name}`);
    doc.text(`Specialization : ${appointment.doctorId.specialization}`);
    doc.text(`Clinic : ${appointment.doctorId.clinicName}`);
    doc.text(`Address : ${appointment.doctorId.clinicAddress}`);
    doc.text(
      `Appointment Type : ${
        appointment.appointmentType === "normal"
          ? "Normal Consultation"
          : appointment.appointmentType === "premium"
            ? "Premium Consultation"
            : "Home Visit"
      }`,
    );

    if (appointment.appointmentType === "normal") {
      doc.text(`Token Number : ${appointment.tokenNumber}`);

      doc.text(
        `Appointment Date : ${new Date(
          appointment.appointmentDate,
        ).toLocaleDateString()}`,
      );
    } else {
      doc.text(
        `Appointment Date : ${new Date(
          appointment.slotDate,
        ).toLocaleDateString()}`,
      );

      doc.text(`Appointment Time : ${appointment.slotTime}`);
    }

    doc.text(`Amount Paid : ₹${appointment.amountPaid}`);
    doc.text(`Payment Status : ${appointment.paymentStatus}`);
    doc.text(`Appointment Status : ${appointment.status}`);

    doc.moveDown(2);

    // ===== QR Code =====

    // ===== QR Code =====

   const fs = require("fs");
   const path = require("path");

   const logoPath = path.join(__dirname, "../uploads/logo.png");

   if (fs.existsSync(logoPath)) {
     doc.image(logoPath, {
       fit: [120, 120],
       align: "center",
     });
   }
    // ===== Patient Instructions =====

    doc.fontSize(14).fillColor("#2563EB").text("Patient Instructions", {
      underline: true,
    });

    doc.moveDown();

    doc
      .fontSize(10)
      .fillColor("black")
      .text("• Please arrive at least 15 minutes before your appointment.");

    doc.text("• Carry this appointment ticket with you.");

    doc.text("• Bring previous prescriptions and medical reports.");

    doc.text("• Follow the doctor's instructions during your visit.");

    doc.moveDown();

    doc.fontSize(12).fillColor("#2563EB").text("Need Help?", {
      align: "center",
    });

    doc.fontSize(10).fillColor("gray").text("📞 +91-9149852051", {
      align: "center",
    });

    doc.text("📧 ka8932007@gmail.com", {
      align: "center",
    });

    doc.text("🌐 www.sehatraj.com", {
      align: "center",
    });

    doc.moveDown();

    doc
      .fontSize(9)
      .fillColor("gray")
      .text(
        "Powered by SehatRaj\nA Product of Qurenix Technologies Pvt. Ltd.",
        {
          align: "center",
        },
      );

    // VERY IMPORTANT
    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  getTicket,
  downloadTicket,
};
