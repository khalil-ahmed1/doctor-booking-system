const cron = require("node-cron");

const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");

const { sendEmail } = require("./emailService");
const reminderEmail = require("../templates/reminderEmail");

const startReminderService = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("⏰ Checking appointment reminders...");

      const now = new Date();

      const appointments = await Appointment.find({
        appointmentType: "premium",
        status: "confirmed",
        reminder24Sent: false,
      });

      for (const appointment of appointments) {
        const patient = await User.findById(appointment.patientId);
        const doctor = await Doctor.findById(appointment.doctorId);

        if (!patient || !doctor) {
          console.log(
            `⚠️ Skipping appointment ${appointment.bookingReference} (Patient or Doctor not found)`,
          );
          continue;
        }

        // Create appointment date & time
        const appointmentDateTime = new Date(appointment.slotDate);

        const [hours, minutes] = appointment.slotTime.split(":").map(Number);

        appointmentDateTime.setHours(hours, minutes, 0, 0);

        const diff = appointmentDateTime.getTime() - now.getTime();

        // Send reminder within 24 hours
        if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
          console.log(
            `📩 Sending reminder for ${appointment.bookingReference}`,
          );

          await sendEmail({
            to: patient.email,
            subject: "Appointment Reminder",
            html: reminderEmail(
              patient.name,
              doctor.name,
              appointment.slotDate.toDateString(),
              appointment.slotTime,
            ),
          });

          appointment.reminder24Sent = true;
          await appointment.save();

          console.log(`✅ Reminder sent to ${patient.email}`);
        }
      }
    } catch (error) {
      console.error("❌ Reminder Service Error:", error);
    }
  });
};

module.exports = {
  startReminderService,
};
