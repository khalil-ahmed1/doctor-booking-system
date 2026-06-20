const PDFDocument = require("pdfkit");

const generateTicket = (appointment, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  // Response Headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${appointment.bookingReference}.pdf`,
  );

  doc.pipe(res);

  // Heading
  doc.fontSize(24).fillColor("#0A4D68").text("Doctor Booking System", {
    align: "center",
  });

  doc.moveDown();

  doc.fontSize(18).fillColor("black").text("Appointment Ticket", {
    align: "center",
  });

  doc.moveDown(2);

  doc.fontSize(14);

  doc.text(`Booking Reference : ${appointment.bookingReference}`);

  doc.moveDown();

  doc.text(`Patient Name : ${appointment.patientId.name}`);

  doc.moveDown();

  doc.text(`Doctor Name : ${appointment.doctorId.name}`);

  doc.moveDown();

  doc.text(`Appointment Type : ${appointment.appointmentType}`);

  doc.moveDown();

  doc.text(`Status : ${appointment.status}`);

  doc.moveDown();

  doc.text(`Payment Status : ${appointment.paymentStatus}`);

  doc.moveDown();

  doc.text(`Amount : ₹${appointment.amountPaid}`);

  doc.moveDown();

  if (appointment.appointmentType === "premium") {
    doc.text(
      `Appointment Date : ${new Date(appointment.slotDate).toDateString()}`,
    );

    doc.moveDown();

    doc.text(`Slot Time : ${appointment.slotTime}`);
  }

  if (appointment.appointmentType === "normal") {
    doc.text(`Token Number : ${appointment.tokenNumber}`);
  }

  if (appointment.appointmentType === "home") {
    doc.text(`Address : ${appointment.homeVisitAddress}`);

    doc.moveDown();

    doc.text(`Landmark : ${appointment.homeVisitLandmark}`);

    doc.moveDown();

    doc.text(`City : ${appointment.homeVisitCity}`);

    doc.moveDown();

    doc.text(`Pincode : ${appointment.homeVisitPincode}`);
  }

  doc.moveDown(3);

  doc
    .fontSize(10)
    .fillColor("gray")
    .text("Thank you for choosing Doctor Booking System.", {
      align: "center",
    });

  doc.end();
};

module.exports = generateTicket;
