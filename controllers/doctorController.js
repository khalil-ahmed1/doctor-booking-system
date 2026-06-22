const Doctor = require("../models/Doctor");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Appointment = require("../models/Appointment");
const registerDoctor = async (req, res) => {
  console.log("REGISTER DOCTOR API HIT");
  try {
    const {
      userId,
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
      premiumBookingEnabled,
    } = req.body;

    // Check if doctor profile already exists
    const existingDoctor = await Doctor.findOne({ userId });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor profile already exists",
      });
    }

    // Create Doctor Profile
    const doctor = await Doctor.create({
      userId,
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
      premiumBookingEnabled,
    });

    res.status(201).json({
      success: true,
      message: "Doctor profile created successfully",
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
  console.log("GET DOCTOR BY ID API HIT");
  console.log("Doctor ID:", req.params.id);
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

    // Today's Date
    const today = new Date();

    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    // Today's appointments
    const appointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).populate("patientId", "name mobile");

    // -----------------------------
    // Normal Appointments
    // -----------------------------
    const normalAppointments = appointments
      .filter((a) => a.appointmentType === "normal")
      .sort((a, b) => a.tokenNumber - b.tokenNumber);

    // -----------------------------
    // Premium Appointments
    // Only Paid & Confirmed
    // -----------------------------
    const premiumAppointments = appointments
      .filter(
        (a) =>
          a.appointmentType === "premium" &&
          ["confirmed", "checked", "completed", "rescheduled"].includes(
            a.status
          )
      )
      .sort((a, b) => a.slotTime.localeCompare(b.slotTime));

    // -----------------------------
    // Home Visit Appointments
    // -----------------------------
    const homeAppointments = appointments.filter(
      (a) => a.appointmentType === "home"
    );

    // -----------------------------
    // Statistics
    // -----------------------------
    const checked = appointments.filter(
      (a) => a.status === "checked"
    ).length;

    const waiting = appointments.filter((a) =>
      ["confirmed", "pending_payment"].includes(a.status)
    ).length;

    const missed = appointments.filter(
      (a) => a.status === "missed"
    ).length;

    const completed = appointments.filter(
      (a) => a.status === "completed"
    ).length;

    const cancelled = appointments.filter(
      (a) => a.status === "cancelled"
    ).length;

    const todayRevenue = appointments
      .filter((a) => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + a.amountPaid, 0);

    res.status(200).json({
      success: true,

      statistics: {
        total: appointments.length,
        waiting,
        checked,
        completed,
        missed,
        cancelled,
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
    // Find doctor profile
    const doctor = await Doctor.findOne({
      userId: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Today's Date
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

    // Today's Appointments
    const appointments = await Appointment.find({
      doctorId: doctor._id,
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }).populate("patientId", "name mobile");

    // Appointment Categories
    const normalAppointments = appointments
      .filter((a) => a.appointmentType === "normal")
      .sort((a, b) => a.tokenNumber - b.tokenNumber);

    const premiumAppointments = appointments
      .filter((a) => a.appointmentType === "premium")
      .sort((a, b) => (a.slotTime || "").localeCompare(b.slotTime || ""));

    const homeAppointments = appointments.filter(
      (a) => a.appointmentType === "home",
    );

    // Dashboard Statistics
    const confirmed = appointments.filter(
      (a) => a.status === "confirmed",
    ).length;

    const checked = appointments.filter((a) => a.status === "checked").length;

    const completed = appointments.filter(
      (a) => a.status === "completed",
    ).length;

    const pendingPayment = appointments.filter(
      (a) => a.status === "pending_payment",
    ).length;

    const cancelled = appointments.filter(
      (a) => a.status === "cancelled",
    ).length;

    const missed = appointments.filter((a) => a.status === "missed").length;

    const totalRevenue = appointments
      .filter((a) => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + a.amountPaid, 0);

    const premiumCount = premiumAppointments.length;
    const normalCount = normalAppointments.length;
    const homeCount = homeAppointments.length;

    res.status(200).json({
      success: true,

      doctor,

      statistics: {
        total: appointments.length,

        confirmed,

        checked,

        completed,

        pendingPayment,

        cancelled,

        missed,

        totalRevenue,

        premiumCount,

        normalCount,

        homeCount,
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
const getDoctorEarnings = async (req, res) => {
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

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      paymentStatus: "paid",
    });

    const now = new Date();

    // Today
    const startToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // Week
    const startWeek = new Date(startToday);
    startWeek.setDate(startToday.getDate() - startToday.getDay());

    // Month
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let today = 0;
    let thisWeek = 0;
    let thisMonth = 0;
    let total = 0;

    appointments.forEach((appointment) => {
      const amount = appointment.amountPaid;
      const date = appointment.paymentCompletedAt || appointment.updatedAt;

      total += amount;

      if (date >= startToday) {
        today += amount;
      }

      if (date >= startWeek) {
        thisWeek += amount;
      }

      if (date >= startMonth) {
        thisMonth += amount;
      }
    });

    res.status(200).json({
      success: true,
      earnings: {
        today,
        thisWeek,
        thisMonth,
        total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getDoctorAnalytics = async (req, res) => {
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

    const appointments = await Appointment.find({
      doctorId: doctor._id,
    });

    const analytics = {
      totalAppointments: appointments.length,

      normalAppointments: appointments.filter(
        (a) => a.appointmentType === "normal",
      ).length,

      premiumAppointments: appointments.filter(
        (a) => a.appointmentType === "premium",
      ).length,

      homeVisitAppointments: appointments.filter(
        (a) => a.appointmentType === "home",
      ).length,

      confirmedAppointments: appointments.filter(
        (a) => a.status === "confirmed",
      ).length,

      checkedAppointments: appointments.filter((a) => a.status === "checked")
        .length,

      completedAppointments: appointments.filter(
        (a) => a.status === "completed",
      ).length,

      cancelledAppointments: appointments.filter(
        (a) => a.status === "cancelled",
      ).length,

      missedAppointments: appointments.filter((a) => a.status === "missed")
        .length,

      pendingPaymentAppointments: appointments.filter(
        (a) => a.status === "pending_payment",
      ).length,
    };

    res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      userId: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const {
      workingDays,
      clinicStartTime,
      clinicEndTime,
      lunchStart,
      lunchEnd,
      maxNormalAppointments,
      maxPremiumAppointments,
      maxHomeVisits,
      vacationMode,
    } = req.body;

    doctor.workingDays = workingDays;
    doctor.clinicStartTime = clinicStartTime;
    doctor.clinicEndTime = clinicEndTime;
    doctor.lunchStart = lunchStart;
    doctor.lunchEnd = lunchEnd;

    doctor.maxNormalAppointments = maxNormalAppointments;
    doctor.maxPremiumAppointments = maxPremiumAppointments;
    doctor.maxHomeVisits = maxHomeVisits;

    doctor.vacationMode = vacationMode;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const updateHomeVisitStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { action } = req.body;

    // Find doctor's profile
    const doctor = await Doctor.findOne({
      userId: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctor._id,
      appointmentType: "home",
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Home visit not found",
      });
    }

    if (action === "accept") {
      appointment.doctorResponse = "accepted";
      appointment.status = "confirmed";
    }

    if (action === "reject") {
      appointment.doctorResponse = "rejected";
      appointment.status = "cancelled";
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      message: `Home visit ${action}ed successfully`,
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
  registerDoctor,
  getAllDoctors,
  getDoctorById,
  updatePremiumSchedule,
  getPremiumSlots,
  getDoctorDashboard,
  getMyDashboard,
  updateHomeVisitStatus,
  getDoctorEarnings,
  getDoctorAnalytics,
  updateAvailability,
};