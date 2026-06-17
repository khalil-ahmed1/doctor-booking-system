const Doctor = require("../models/Doctor");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Appointment = require("../models/Appointment");
const registerDoctor = async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      password,
      specialization,
      qualification,
      experience,
      clinicName,
      clinicAddress,
      consultationFee,
      premiumFee,
      homeVisitFee,
      homeVisitAvailable,
    } = req.body;

    // Check existing user
    const existingUser = await User.findOne({
      $or: [{ mobile }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Doctor already registered with this mobile or email",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User Account
    const user = await User.create({
      name,
      mobile,
      email,
      password: hashedPassword,
      role: "doctor",
    });

    // Create Doctor Profile
    const doctor = await Doctor.create({
      userId: user._id,
      name,
      specialization,
      qualification,
      experience,
      clinicName,
      clinicAddress,
      consultationFee,
      premiumFee,
      homeVisitFee,
      homeVisitAvailable,
    });

    res.status(201).json({
      success: true,
      message: "Doctor registered successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getAllDoctors = async (req, res) => {
  try {
    const keyword = req.query.specialization
      ? {
          specialization: {
            $regex: req.query.specialization,
            $options: "i",
          },
        }
      : {};

    const doctors = await Doctor.find(keyword);
    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updatePremiumSchedule = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    doctor.premiumStartTime = req.body.premiumStartTime;

    doctor.premiumEndTime = req.body.premiumEndTime;

    doctor.slotDuration = req.body.slotDuration;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Premium schedule updated",
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getPremiumSlots = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const slots = [];

    const start = doctor.premiumStartTime;
    const end = doctor.premiumEndTime;
    const duration = doctor.slotDuration;

    let [startHour, startMinute] = start.split(":").map(Number);

    let [endHour, endMinute] = end.split(":").map(Number);

    let currentMinutes = startHour * 60 + startMinute;

    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes < endMinutes) {
      const hours = Math.floor(currentMinutes / 60);

      const minutes = currentMinutes % 60;

      const slot = `${String(hours).padStart(2, "0")}:${String(
        minutes,
      ).padStart(2, "0")}`;

      slots.push(slot);

      currentMinutes += duration;
    }

    // Get booking date from query
    const selectedDate = req.query.date;

    let bookedSlots = [];

    if (selectedDate) {
      const appointments = await Appointment.find({
        doctorId: doctor._id,
        appointmentType: "premium",
        slotDate: new Date(selectedDate),
        status: {
          $in: ["booked", "checked", "completed", "rescheduled"],
        },
      });

      bookedSlots = appointments.map((a) => a.slotTime);
    }

    // Remove booked slots
    const availableSlots = slots.filter((slot) => !bookedSlots.includes(slot));

    res.status(200).json({
      success: true,
      date: selectedDate,
      totalSlots: slots.length,
      bookedSlots,
      availableSlots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.params.id;

    // Today's date
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

    // Fetch today's appointments
    const appointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).populate("patientId", "name mobile");

    // Separate appointment types
   const normalAppointments = appointments
     .filter((a) => a.appointmentType === "normal")
     .sort((a, b) => a.tokenNumber - b.tokenNumber);

const premiumAppointments = appointments
  .filter((a) => a.appointmentType === "premium")
  .sort((a, b) => a.slotTime.localeCompare(b.slotTime));

    const homeAppointments = appointments.filter(
      (a) => a.appointmentType === "home",
    );

    // Statistics
    const checked = appointments.filter((a) => a.status === "checked").length;

    const waiting = appointments.filter((a) => a.status === "booked").length;

    const missed = appointments.filter((a) => a.status === "missed").length;
    const todayRevenue = appointments
      .filter((a) => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + a.amountPaid, 0);

    res.status(200).json({
      success: true,

      statistics: {
        total: appointments.length,
        checked,
        waiting,
        missed,
        todayRevenue,
      },

      normalAppointments,
      premiumAppointments,
      homeAppointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getMyDashboard = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      userId: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
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

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).populate("patientId", "name mobile");

    res.status(200).json({
      success: true,
      doctor,
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
  registerDoctor,
  getAllDoctors,
  getDoctorById,
  updatePremiumSchedule,
  getDoctorDashboard,
  getPremiumSlots,
  getMyDashboard,
};