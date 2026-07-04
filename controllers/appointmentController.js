const Appointment = require("../models/Appointment");
const checkDoctorSubscription = require("../utils/checkDoctorSubscription");
const sendNotification = require("../services/notificationService");
const { sendEmail, sendAppointmentEmail } = require("../services/emailService");
const User = require("../models/User");
const DailyCounter = require("../models/DailyCounter");


const createNormalAppointment = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const patientId = req.user._id;
    // Find doctor
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    if (
      doctor.subscriptionStatus === "expired" ||
      doctor.subscriptionStatus === "suspended"
    ) {
      return res.status(400).json({
        success: false,
        message: "Doctor is currently unavailable.",
      });
    }

    // Vacation Check
    if (doctor.vacationMode) {
      return res.status(400).json({
        success: false,
        message: "Doctor is currently on vacation",
      });
    }
    const today = new Date();

    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1,
    );

    const counterId = `normal_${doctorId}_${startOfDay.getTime()}`;
    const nextToken = await DailyCounter.incrementToken(counterId);

    console.log("Doctor Fee:", doctor.consultationFee);
    console.log("Doctor:", doctor);
const appointment = await Appointment.create({
  patientId,
  doctorId,
  appointmentType: "normal",
  amountPaid: doctor.consultationFee,
  tokenNumber: nextToken,
  appointmentDate: today,
});
console.log("Saved Appointment:", appointment);
    res.status(201).json({
      success: true,
      tokenNumber: nextToken,
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const Doctor = require("../models/Doctor");


const createPremiumAppointment = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { doctorId, slotDate, slotTime } = req.body;
    const patientId = req.user._id;
    console.log("Logged in user:", req.user);
    // 1. Find doctor
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (
      doctor.subscriptionStatus === "expired" ||
      doctor.subscriptionStatus === "suspended"
    ) {
      return res.status(400).json({
        success: false,
        message: "Doctor is currently unavailable.",
      });
    }
    // Vacation Check
    if (doctor.vacationMode) {
      return res.status(400).json({
        success: false,
        message: "Doctor is currently on vacation",
      });
    }
    if (!doctor.premiumBookingEnabled) {
      return res.status(400).json({
        success: false,
        message: "Premium booking is disabled for this doctor",
      });
    }
    if (
      slotTime < doctor.premiumStartTime ||
      slotTime >= doctor.premiumEndTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot selected",
      });
    }
    const bookingDate = new Date(slotDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Check Working Day
    const dayName = bookingDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    if (!doctor.workingDays.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Doctor does not work on ${dayName}`,
      });
    }
    // Lunch Break Validation
    const slotMinutes =
      Number(slotTime.split(":")[0]) * 60 + Number(slotTime.split(":")[1]);

    const lunchStartMinutes =
      Number(doctor.lunchStart.split(":")[0]) * 60 +
      Number(doctor.lunchStart.split(":")[1]);

    const lunchEndMinutes =
      Number(doctor.lunchEnd.split(":")[0]) * 60 +
      Number(doctor.lunchEnd.split(":")[1]);

    if (slotMinutes >= lunchStartMinutes && slotMinutes < lunchEndMinutes) {
      return res.status(400).json({
        success: false,
        message: "Doctor is unavailable during lunch break",
      });
    }
    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: "Past dates cannot be booked",
      });
    }
    // 2. Check subscription
   await checkDoctorSubscription(doctor);

   if (!["active", "trial"].includes(doctor.subscriptionStatus)) {
     return res.status(400).json({
       success: false,
       message: "Doctor is currently unavailable",
     });
   }

    // 3. Check duplicate booking

    // Check if this premium slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctorId,
      slotDate: new Date(slotDate),
      slotTime,
      appointmentType: "premium",
      status: {
        $in: ["booked", "checked", "completed", "rescheduled"],
      },
    });
    // Check Daily Premium Limit atomically
    const counterId = `premium_${doctorId}_${new Date(slotDate).getTime()}`;
    const limitReached = !(await DailyCounter.incrementAndCheckLimit(counterId, doctor.maxPremiumAppointments));

    if (limitReached) {
      return res.status(400).json({
        success: false,
        message: "Maximum premium appointments reached for this day",
      });
    }

    console.log("Existing Appointment:", existingAppointment);

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This slot is already booked",
      });
    }

    // 4. Create appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentType: "premium",
      slotDate,
      slotTime,
      paymentStatus: "pending",
      amountPaid: doctor.premiumFee,
      status: "pending_payment",
    });
    // Send notification to doctor
    const doctorUser = await Doctor.findById(doctorId);

    await sendNotification(
      doctorUser.userId,
      "New Premium Appointment",
      `You have received a new premium appointment for ${slotDate} at ${slotTime}.`,
      "appointment",
    );
    // Send email to patient

   
    res.status(201).json({
      success: true,
      message: "Premium appointment booked successfully",
      bookingReference: appointment.bookingReference,
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


 const createHomeVisitAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      visitDate,
      slotTime,
      homeVisitAddress,
      homeVisitLandmark,
      homeVisitCity,
      homeVisitPincode,
    } = req.body;
    const bookingDate = new Date(visitDate);
    bookingDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: "Past dates cannot be booked.",
      });
    }
    const patientId = req.user._id;

    // Find doctor
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Vacation Check
    if (doctor.vacationMode) {
      return res.status(400).json({
        success: false,
        message: "Doctor is currently on vacation",
      });
    }

    // Home Visit Availability
    if (!doctor.homeVisitAvailable) {
      return res.status(400).json({
        success: false,
        message: "Home visit is not available for this doctor",
      });
    }

    // Subscription Check
    if (
      !["active", "trial", "adminApproved"].includes(
        doctor.subscriptionStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Doctor is currently unavailable",
      });
    }

    // Check Daily Home Visit Limit atomically
    const selectedDate = new Date(visitDate);
    selectedDate.setHours(0, 0, 0, 0);

    const counterId = `home_${doctorId}_${selectedDate.getTime()}`;
    const limitReached = !(await DailyCounter.incrementAndCheckLimit(counterId, doctor.maxHomeVisits));

    if (limitReached) {
      return res.status(400).json({
        success: false,
        message: "Maximum home visits reached for today",
      });
    }

    // Create Appointment

 const appointment = await Appointment.create({
   patientId,
   doctorId,

   appointmentType: "home",

   slotDate: new Date(visitDate),

   slotTime,

   homeVisitAddress,
   homeVisitLandmark,
   homeVisitCity,
   homeVisitPincode,

   doctorResponse: "pending",

   amountPaid: doctor.homeVisitFee,

   paymentStatus: "pending",

   status: "pending_payment",
 });

    // Notify Doctor
   await sendNotification(
     doctor.userId,
     "New Home Visit Request",
     `A patient has requested a home visit in ${homeVisitCity}.`,
     "homeVisit",
   );
const patient = await User.findById(patientId);

await sendAppointmentEmail(
  patient.email,
  "Home Visit Request",
  patient.name,
  doctor.name,
  appointment.bookingReference,
  appointment.slotDate,
  appointment.slotTime,
);     
    res.status(201).json({
      success: true,
      message: "Home visit appointment created",
      bookingReference: appointment.bookingReference,
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctorId: req.params.doctorId,
    })
      .populate("patientId", "name mobile email")
      .sort({ tokenNumber: 1 });

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
const markAppointmentChecked = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.status = "checked";

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment checked",
      appointment,
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
    const { reason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Already cancelled
    if (
      appointment.status === "cancelled_by_patient" ||
      appointment.status === "cancelled_by_doctor"
    ) {
      return res.status(400).json({
        success: false,
        message: "Appointment already cancelled",
      });
    }

    // Only booking patient can cancel
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Patient
    const patient = await User.findById(appointment.patientId);

    // Doctor Profile
    const doctor = await Doctor.findById(appointment.doctorId);

    if (!patient || !doctor) {
      return res.status(404).json({
        success: false,
        message: "Patient or Doctor not found",
      });
    }

    // Doctor Login Account
    const doctorUser = await User.findById(doctor.userId);

    // Update Appointment
    appointment.status = "cancelled_by_patient";
    appointment.cancelReason = reason || "";
    appointment.cancelledBy = "patient";
    appointment.cancelledAt = new Date();

    if (appointment.paymentStatus === "paid") {
      appointment.paymentStatus = "refund_pending";
    }

    await appointment.save();

    // Send Notification
    if (doctorUser) {
      await sendNotification(
        doctorUser._id,
        "Appointment Cancelled",
        `${patient.name} cancelled the appointment scheduled on ${appointment.slotDate.toDateString()} at ${appointment.slotTime}.`,
        "appointment",
      );
    }

    // Email Patient
    if (patient.email) {
      await sendEmail({
        to: patient.email,
        subject: "Appointment Cancelled",
        html: cancellationEmail(
          patient.name,
          doctor.name,
          appointment.slotDate.toDateString(),
          appointment.slotTime,
          appointment.bookingReference,
        ),
      });
    }

    // Email Doctor
    if (doctorUser && doctorUser.email) {
      await sendEmail({
        to: doctorUser.email,
        subject: "Patient Cancelled Appointment",
        html: doctorCancellationEmail(
          doctor.name,
          patient.name,
          appointment.slotDate.toDateString(),
          appointment.slotTime,
          appointment.bookingReference,
        ),
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getAppointmentTicket = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name mobile email")
      .populate(
        "doctorId",
        "name specialization clinicName clinicAddress consultationFee",
      );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
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
  createNormalAppointment,
  getDoctorAppointments,
  markAppointmentChecked,
  createPremiumAppointment,
  createHomeVisitAppointment,
  cancelAppointment,
  getAppointmentTicket,
};