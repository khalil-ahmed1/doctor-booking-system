const razorpay = require("../config/razorpay");
const Appointment = require("../models/Appointment");
const crypto = require("crypto");
const { sendAppointmentEmail } = require("../services/emailService");
const SUBSCRIPTION_PLANS = require("../config/subscriptionPlans");

const Doctor = require("../models/Doctor");
const DoctorSubscription = require("../models/DoctorSubscription");


const createOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Already Paid
    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed",
      });
    }

    // Amount must be greater than zero
    if (!appointment.amountPaid || appointment.amountPaid <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment amount",
      });
    }

    const options = {
      amount: appointment.amountPaid * 100,
      currency: "INR",
      receipt: appointment.bookingReference,
    };

    const order = await razorpay.orders.create(options);

    // Save Razorpay Order
    appointment.orderId = order.id;
    appointment.paymentStatus = "processing";

    await appointment.save();

    res.status(200).json({
      success: true,
      order,
      appointment,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const createSubscriptionOrder = async (req, res) => {
  try {
    const { plan } = req.body;

    const doctor = await Doctor.findOne({
      userId: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

   const selectedPlan = SUBSCRIPTION_PLANS[plan];

   if (!selectedPlan) {
     return res.status(400).json({
       success: false,
       message: "Invalid subscription plan",
     });
   }

   const amount = selectedPlan.amount;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `SUB${Date.now()}`,
    });

    const subscription = await DoctorSubscription.create({
      doctorId: doctor._id,
      plan,
      amount,
      orderId: order.id,
    });

    res.status(200).json({
      success: true,
      order,
      subscription,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const appointment = await Appointment.findOne({
      orderId: razorpay_order_id,
    });

    console.log("========== VERIFY PAYMENT ==========");
    console.log("Razorpay Order:", razorpay_order_id);

    if (appointment) {
      console.log("Appointment Found:", appointment._id);
      console.log("Before Save Payment Status:", appointment.paymentStatus);
    } else {
      console.log("Appointment NOT FOUND");
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed",
      });
    }

    appointment.paymentStatus = "paid";
    appointment.status = "confirmed";

    appointment.paymentId = razorpay_payment_id;
    appointment.paymentMethod = "razorpay";
    appointment.paymentCompletedAt = new Date();

    await appointment.save();
    console.log("After Save Payment Status:", appointment.paymentStatus);
    console.log("========== PAYMENT SAVED ==========");

    // Populate patient & doctor before sending email
    await appointment.populate("patientId", "name email");
    await appointment.populate("doctorId", "name");
    console.log("Sending appointment email...");
    console.log("To:", appointment.patientId.email);

    await sendAppointmentEmail(
      appointment.patientId.email,
      "Appointment Confirmed - SehatRaj",
      appointment.patientId.name,
      appointment.doctorId.name,
      appointment.bookingReference,
      new Date(appointment.appointmentDate).toLocaleDateString(),
      appointment.slotTime || appointment.tokenNumber,
    );
    console.log("Appointment email function completed.");
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      appointment,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    const subscription = await DoctorSubscription.findOne({
      orderId: razorpay_order_id,
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (subscription.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Subscription already activated",
      });
    }

    subscription.paymentStatus = "paid";
    subscription.paymentId = razorpay_payment_id;

    const startDate = new Date();

    let expiryDate = new Date();

    const selectedPlan = SUBSCRIPTION_PLANS[subscription.plan];

    expiryDate.setMonth(expiryDate.getMonth() + selectedPlan.months);

    subscription.startDate = startDate;
    subscription.expiryDate = expiryDate;

    await subscription.save();

    const doctor = await Doctor.findById(subscription.doctorId);

    doctor.subscriptionStatus = "active";
    doctor.subscriptionPlan = subscription.plan;
    doctor.subscriptionStartDate = startDate;
    doctor.subscriptionExpiryDate = expiryDate;
    doctor.subscriptionAmount = subscription.amount;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
      doctor,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  createSubscriptionOrder,
  verifySubscriptionPayment,
};
