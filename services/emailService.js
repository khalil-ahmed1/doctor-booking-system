const nodemailer = require("nodemailer");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generic Email
const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Nexora Technologies" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", to);
  } catch (error) {
    console.log("❌ Email Error:", error.message);
  }
};

// Appointment Email
const sendAppointmentEmail = async (
  to,
  subject,
  patientName,
  doctorName,
  bookingReference,
  appointmentDate,
  appointmentTime,
) => {
  try {
    const appointmentEmail = require("../templates/appointmentEmail");

    await transporter.sendMail({
      from: `"Nexora Technologies" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: appointmentEmail(
        patientName,
        doctorName,
        bookingReference,
        appointmentDate,
        appointmentTime,
      ),
    });

    console.log("✅ Appointment email sent");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  sendEmail,
  sendAppointmentEmail,
};
