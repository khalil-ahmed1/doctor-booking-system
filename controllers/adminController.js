const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Appointment = require("../models/Appointment");

const getAdminDashboard = async (req, res) => {
  try {
    const totalDoctors = await Doctor.countDocuments();

    const totalPatients = await User.countDocuments({
      role: "patient",
    });

    const totalAppointments = await Appointment.countDocuments();

    const pendingDoctors = await Doctor.countDocuments({
      subscriptionStatus: "inactive",
    });

    const activeDoctors = await Doctor.countDocuments({
      subscriptionStatus: "active",
    });

    const totalRevenue = await Appointment.aggregate([
      {
        $match: {
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          revenue: {
            $sum: "$amountPaid",
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,

      statistics: {
        totalDoctors,
        activeDoctors,
        pendingDoctors,
        totalPatients,
        totalAppointments,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].revenue : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({
      subscriptionStatus: "inactive",
    }).sort({ createdAt: -1 });

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
const approveDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    doctor.subscriptionStatus = "active";

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Doctor approved successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const suspendDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    doctor.subscriptionStatus = "suspended";

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Doctor suspended successfully",
      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
    getPendingDoctors,
    approveDoctor,
    suspendDoctor,
};
