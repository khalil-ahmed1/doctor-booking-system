const cron = require("node-cron");

const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");

const { sendEmail } = require("./emailService");

const reminderEmail = require("../templates/reminderEmail");

const startReminderService = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("Checking appointment reminders...");

      const now = new Date();

      const appointments = await Appointment.find({
        appointmentType: "premium",
        status: "confirmed",
        reminder24Sent: false,
      });

      console.log("Appointments Found:", appointments.length);

      for (const appointment of appointments) {
        console.log("--------------------------------");
        console.log("Booking:", appointment.bookingReference);
        console.log("Slot Date:", appointment.slotDate);
        console.log("Slot Time:", appointment.slotTime);

        const patient = await User.findById(appointment.patientId);
        const doctor = await Doctor.findById(appointment.doctorId);

        if (!patient || !doctor) continue;

        // Create full appointment date & time
        const appointmentDateTime = new Date(appointment.slotDate);

        const [hours, minutes] = appointment.slotTime.split(":").map(Number);

        appointmentDateTime.setHours(hours);
        appointmentDateTime.setMinutes(minutes);
        appointmentDateTime.setSeconds(0);

        console.log("Appointment DateTime:", appointmentDateTime);
        console.log("Current Time:", now);

        const diff = appointmentDateTime.getTime() - now.getTime();

        console.log("Difference (Hours):", diff / (1000 * 60 * 60));

        if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
          console.log("Sending reminder to:", patient.email);

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
          console.log("✅ Reminder Sent");
        } else {
          console.log("❌ Not within next 24 hours");
        }
      }
    } catch (error) {
      console.log(error);
    }
  });
};

module.exports = {
  startReminderService,
};
