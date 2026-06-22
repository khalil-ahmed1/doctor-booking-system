const Appointment = require("../models/Appointment");

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

    const lastAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).sort({ tokenNumber: -1 });

    const nextToken = lastAppointment ? lastAppointment.tokenNumber + 1 : 1;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      tokenNumber: nextToken,
      appointmentDate: today,
    });

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
    if (
      !["active", "trial", "adminApproved"].includes(doctor.subscriptionStatus)
    ) {
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
    // Check Daily Premium Limit
    const premiumCount = await Appointment.countDocuments({
      doctorId,
      appointmentType: "premium",
      slotDate: new Date(slotDate),
      status: {
        $nin: ["cancelled", "missed"],
      },
    });

    if (premiumCount >= doctor.maxPremiumAppointments) {
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
      homeVisitAddress,
      homeVisitLandmark,
      homeVisitCity,
      homeVisitPincode,
    } = req.body;

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
    // Check home visit availability
    if (!doctor.homeVisitAvailable) {
      return res.status(400).json({
        success: false,
        message: "Home visit is not available for this doctor",
      });
    }

    // Check subscription
    if (
      !["active", "trial", "adminApproved"].includes(doctor.subscriptionStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Doctor is currently unavailable",
      });
    }

    // Create Appointment
    const appointment = await Appointment.create({
      patientId,
      doctorId,

      appointmentType: "home",

      homeVisitAddress,
      homeVisitLandmark,
      homeVisitCity,
      homeVisitPincode,

      doctorResponse: "pending",

      amountPaid: doctor.homeVisitFee,

      paymentStatus: "pending",

      status: "pending_payment",
    });
    // Check Daily Home Visit Limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const homeVisitCount = await Appointment.countDocuments({
      doctorId,
      appointmentType: "home",
      appointmentDate: {
        $gte: today,
        $lt: tomorrow,
      },
      status: {
        $nin: ["cancelled", "missed"],
      },
    });

    if (homeVisitCount >= doctor.maxHomeVisits) {
      return res.status(400).json({
        success: false,
        message: "Maximum home visits reached for today",
      });
    }

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
module.exports = {
  createNormalAppointment,
  getDoctorAppointments,
  markAppointmentChecked,
  createPremiumAppointment,
  createHomeVisitAppointment,
};