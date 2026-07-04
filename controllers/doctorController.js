const Doctor = require("../models/Doctor");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Appointment = require("../models/Appointment");
const checkDoctorSubscription = require("../utils/checkDoctorSubscription");

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
    const escapeRegex = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    const keyword = req.query.specialization
      ? {
          specialization: {
            $regex: escapeRegex(req.query.specialization),
            $options: "i",
          },
        }
      : {};

    const page = parseInt(req.query.page, 10) || 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : 0;
    const skip = (page - 1) * (limit || 0);

    const query = Doctor.find(keyword);
    if (limit > 0) {
      query.skip(skip).limit(limit);
    }
    
    const doctors = await query;
    const totalCount = await Doctor.countDocuments(keyword);

    res.status(200).json({
      success: true,
      count: totalCount,
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
   const doctor = await Doctor.findOne({
     _id: req.params.id,
     subscriptionStatus: {
       $in: ["trial", "active"],
     },
   });

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
    const duration = doctor.premiumSlotDuration;

    if (!duration || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid premium slot duration",
      });
    }

    let [startHour, startMinute] = start.split(":").map(Number);

    let [endHour, endMinute] = end.split(":").map(Number);

    let currentMinutes = startHour * 60 + startMinute;

    const endMinutes = endHour * 60 + endMinute;

while (currentMinutes < endMinutes) {
  const slotMinutes = currentMinutes;

  const lunchStart =
    Number(doctor.lunchStart.split(":")[0]) * 60 +
    Number(doctor.lunchStart.split(":")[1]);

  const lunchEnd =
    Number(doctor.lunchEnd.split(":")[0]) * 60 +
    Number(doctor.lunchEnd.split(":")[1]);

  // Skip lunch slots
  if (slotMinutes >= lunchStart && slotMinutes < lunchEnd) {
    currentMinutes += duration;
    continue;
  }

  const hours = Math.floor(currentMinutes / 60);
  const minutes = currentMinutes % 60;

  const slot = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;

  slots.push(slot);

  currentMinutes += duration;
}
    // Get booking date from query
    const selectedDate = req.query.date;
    const bookingDate = new Date(selectedDate);

    const dayName = bookingDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    if (!doctor.premiumWorkingDays.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Doctor does not provide Premium Consultation on ${dayName}`,
      });
    }

    let bookedSlots = [];

    if (selectedDate) {
      const appointments = await Appointment.find({
        doctorId: doctor._id,
        appointmentType: "premium",
        slotDate: new Date(selectedDate),
        status: {
          $in: ["confirmed", "checked", "completed", "pending_payment"],
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
const getHomeVisitSlots = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Home Visit Enabled
    if (!doctor.homeVisitAvailable) {
      return res.status(400).json({
        success: false,
        message: "Home Visit is disabled",
      });
    }

    const selectedDate = req.query.date;

    if (!selectedDate) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    // Check Working Day
    const bookingDate = new Date(selectedDate);

    const dayName = bookingDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    if (!doctor.homeVisitWorkingDays.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Doctor does not provide Home Visits on ${dayName}`,
      });
    }

    const slots = [];

    const start = doctor.homeVisitStartTime;

    const end = doctor.homeVisitEndTime;

    const duration = doctor.homeVisitSlotDuration;

    if (!duration || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid home visit slot duration",
      });
    }

    let [startHour, startMinute] = start.split(":").map(Number);

    let [endHour, endMinute] = end.split(":").map(Number);

    let currentMinutes = startHour * 60 + startMinute;

    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes < endMinutes) {
      const slotMinutes = currentMinutes;

      // Skip Lunch Break
      const lunchStart =
        Number(doctor.lunchStart.split(":")[0]) * 60 +
        Number(doctor.lunchStart.split(":")[1]);

      const lunchEnd =
        Number(doctor.lunchEnd.split(":")[0]) * 60 +
        Number(doctor.lunchEnd.split(":")[1]);

      if (slotMinutes >= lunchStart && slotMinutes < lunchEnd) {
        currentMinutes += duration;
        continue;
      }

      const hours = Math.floor(currentMinutes / 60);

      const minutes = currentMinutes % 60;

      const slot = `${String(hours).padStart(2, "0")}:${String(
        minutes,
      ).padStart(2, "0")}`;

      slots.push(slot);

      currentMinutes += duration;
    }

    // Already booked Home Visit slots
    const appointments = await Appointment.find({
      doctorId: doctor._id,
      appointmentType: "home",
      slotDate: new Date(selectedDate),
      status: {
        $in: ["confirmed", "checked", "completed", "pending_payment"],
      },
    });

    const bookedSlots = appointments.map((a) => a.slotTime);

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

    await checkDoctorSubscription(doctor);

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
const getAvailability = async (req, res) => {
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
const getMyAppointments = async (req, res) => {
  try {
    // Find logged-in doctor's profile
    const doctor = await Doctor.findOne({
      userId: req.user._id,
    });
await checkDoctorSubscription(doctor);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Get all appointments
    const appointments = await Appointment.find({
      doctorId: doctor._id,
    })
      .populate("patientId", "name mobile email")
      .sort({ appointmentDate: -1, tokenNumber: 1 });

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
const getDoctorEarnings = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      userId: req.user._id,
    });
await checkDoctorSubscription(doctor);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeek = new Date(startToday);
    startWeek.setDate(startToday.getDate() - startToday.getDay());
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const results = await Appointment.aggregate([
      { $match: { doctorId: doctor._id, paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amountPaid" },
          today: {
            $sum: {
              $cond: [
                { $gte: [{ $ifNull: ["$paymentCompletedAt", "$updatedAt"] }, startToday] },
                "$amountPaid",
                0
              ]
            }
          },
          thisWeek: {
            $sum: {
              $cond: [
                { $gte: [{ $ifNull: ["$paymentCompletedAt", "$updatedAt"] }, startWeek] },
                "$amountPaid",
                0
              ]
            }
          },
          thisMonth: {
            $sum: {
              $cond: [
                { $gte: [{ $ifNull: ["$paymentCompletedAt", "$updatedAt"] }, startMonth] },
                "$amountPaid",
                0
              ]
            }
          }
        }
      }
    ]);

    const earnings = results.length > 0 ? {
      today: results[0].today,
      thisWeek: results[0].thisWeek,
      thisMonth: results[0].thisMonth,
      total: results[0].total
    } : { today: 0, thisWeek: 0, thisMonth: 0, total: 0 };

    res.status(200).json({
      success: true,
      earnings,
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
await checkDoctorSubscription(doctor);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const results = await Appointment.aggregate([
      { $match: { doctorId: doctor._id } },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          normalAppointments: { $sum: { $cond: [{ $eq: ["$appointmentType", "normal"] }, 1, 0] } },
          premiumAppointments: { $sum: { $cond: [{ $eq: ["$appointmentType", "premium"] }, 1, 0] } },
          homeVisitAppointments: { $sum: { $cond: [{ $eq: ["$appointmentType", "home"] }, 1, 0] } },
          confirmedAppointments: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } },
          checkedAppointments: { $sum: { $cond: [{ $eq: ["$status", "checked"] }, 1, 0] } },
          completedAppointments: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          cancelledAppointments: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          missedAppointments: { $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] } },
          pendingPaymentAppointments: { $sum: { $cond: [{ $eq: ["$status", "pending_payment"] }, 1, 0] } }
        }
      }
    ]);

    const analytics = results.length > 0 ? {
      totalAppointments: results[0].totalAppointments,
      normalAppointments: results[0].normalAppointments,
      premiumAppointments: results[0].premiumAppointments,
      homeVisitAppointments: results[0].homeVisitAppointments,
      confirmedAppointments: results[0].confirmedAppointments,
      checkedAppointments: results[0].checkedAppointments,
      completedAppointments: results[0].completedAppointments,
      cancelledAppointments: results[0].cancelledAppointments,
      missedAppointments: results[0].missedAppointments,
      pendingPaymentAppointments: results[0].pendingPaymentAppointments
    } : {
      totalAppointments: 0,
      normalAppointments: 0,
      premiumAppointments: 0,
      homeVisitAppointments: 0,
      confirmedAppointments: 0,
      checkedAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      missedAppointments: 0,
      pendingPaymentAppointments: 0
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
    await checkDoctorSubscription(doctor);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const {
      // Normal
      workingDays,
      clinicStartTime,
      clinicEndTime,
      lunchStart,
      lunchEnd,
      maxNormalAppointments,

      // Premium
      premiumWorkingDays,
      premiumStartTime,
      premiumEndTime,
      premiumSlotDuration,
      premiumClinicAddress,
      maxPremiumAppointments,

      // Home Visit
      homeVisitWorkingDays,
      homeVisitStartTime,
      homeVisitEndTime,
      homeVisitSlotDuration,
      homeVisitBaseAddress,
      maxHomeVisits,

      // General
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
    // Premium Settings
    doctor.premiumWorkingDays = premiumWorkingDays;
    doctor.premiumStartTime = premiumStartTime;
    doctor.premiumEndTime = premiumEndTime;
    doctor.premiumSlotDuration = premiumSlotDuration;
    doctor.premiumClinicAddress = premiumClinicAddress;

    // Home Visit Settings
    doctor.homeVisitWorkingDays = homeVisitWorkingDays;
    doctor.homeVisitStartTime = homeVisitStartTime;
    doctor.homeVisitEndTime = homeVisitEndTime;
    doctor.homeVisitSlotDuration = homeVisitSlotDuration;
    doctor.homeVisitBaseAddress = homeVisitBaseAddress;

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
const searchDoctors = async (req, res) => {
  try {
    const { specialization, clinic, homeVisit, premium, minFee, maxFee } =
      req.query;

    let filter = {
      subscriptionStatus: {
        $in: ["active", "trial", "adminApproved"],
      },
      vacationMode: false,
    };

    if (specialization) {
      filter.specialization = {
        $regex: specialization,
        $options: "i",
      };
    }

    if (clinic) {
      filter.clinicName = {
        $regex: clinic,
        $options: "i",
      };
    }

    if (homeVisit === "true") {
      filter.homeVisitAvailable = true;
    }

    if (premium === "true") {
      filter.premiumBookingEnabled = true;
    }

    if (minFee || maxFee) {
      filter.consultationFee = {};

      if (minFee) filter.consultationFee.$gte = Number(minFee);

      if (maxFee) filter.consultationFee.$lte = Number(maxFee);
    }

    const doctors = await Doctor.find({
      subscriptionStatus: {
        $in: ["trial", "active"],
      },

      // keep your existing search conditions here
    });

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
module.exports = {
  registerDoctor,
  getAllDoctors,
  getDoctorById,
  updatePremiumSchedule,
  getPremiumSlots,
  getDoctorDashboard,
  getMyDashboard,
  getAvailability,
  updateHomeVisitStatus,
  getDoctorEarnings,
  getDoctorAnalytics,
  updateAvailability,
  searchDoctors,
  getMyAppointments,
  getHomeVisitSlots,
};