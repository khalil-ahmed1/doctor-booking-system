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

    const appointment = await Appointment.findOneAndUpdate(
      { orderId: razorpay_order_id, paymentStatus: { $ne: "paid" } },
      {
        $set: {
          paymentStatus: "paid",
          status: "confirmed",
          paymentId: razorpay_payment_id,
          paymentMethod: "razorpay",
          paymentCompletedAt: new Date(),
        },
      },
      { new: true }
    );

    console.log("========== VERIFY PAYMENT ==========");
    console.log("Razorpay Order:", razorpay_order_id);

    if (!appointment) {
      const existingAppt = await Appointment.findOne({ orderId: razorpay_order_id });
      if (!existingAppt) {
        console.log("Appointment NOT FOUND");
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }
      if (existingAppt.paymentStatus === "paid") {
        console.log("Payment already completed");
        return res.status(400).json({
          success: false,
          message: "Payment already completed",
        });
      }
    }

    console.log("Appointment Found:", appointment._id);
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

    const startDate = new Date();

    const initialSub = await DoctorSubscription.findOne({
      orderId: razorpay_order_id,
    });

    if (!initialSub) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[initialSub.plan];
    let expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + selectedPlan.months);

    const subscription = await DoctorSubscription.findOneAndUpdate(
      { orderId: razorpay_order_id, paymentStatus: { $ne: "paid" } },
      {
        $set: {
          paymentStatus: "paid",
          paymentId: razorpay_payment_id,
          startDate: startDate,
          expiryDate: expiryDate,
        },
      },
      { new: true }
    );

    if (!subscription) {
      const existingSub = await DoctorSubscription.findOne({ orderId: razorpay_order_id });
      if (existingSub && existingSub.paymentStatus === "paid") {
        return res.status(400).json({
          success: false,
          message: "Subscription already activated",
        });
      }
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { _id: subscription.doctorId },
      {
        $set: {
          subscriptionStatus: "active",
          subscriptionPlan: subscription.plan,
          subscriptionStartDate: startDate,
          subscriptionExpiryDate: expiryDate,
          subscriptionAmount: subscription.amount,
        }
      },
      { new: true }
    );

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

const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return res.status(400).json({
        success: false,
        message: "Missing signature or secret",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody || JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;

    if (!paymentEntity) {
      return res.status(200).json({ success: true, message: "No payment entity" });
    }

    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    if (event === "payment.captured") {
      // 1. Check if it's an Appointment
      const appointment = await Appointment.findOne({ orderId });
      
      if (appointment) {
        if (appointment.paymentStatus !== "paid") {
          appointment.paymentStatus = "paid";
          appointment.status = "confirmed";
          appointment.paymentId = paymentId;
          appointment.paymentMethod = "razorpay";
          appointment.paymentCompletedAt = new Date();
          await appointment.save();

          // Send Confirmation Email
          await appointment.populate("patientId", "name email");
          await appointment.populate("doctorId", "name");
          
          if (appointment.patientId && appointment.patientId.email) {
             await sendAppointmentEmail(
               appointment.patientId.email,
               "Appointment Confirmed - SehatRaj",
               appointment.patientId.name,
               appointment.doctorId.name,
               appointment.bookingReference,
               new Date(appointment.appointmentDate).toLocaleDateString(),
               appointment.slotTime || appointment.tokenNumber
             );
          }
        }
        return res.status(200).json({ success: true });
      }

      // 2. Check if it's a Subscription
      const subscription = await DoctorSubscription.findOne({ orderId });
      
      if (subscription) {
        if (subscription.paymentStatus !== "paid") {
          const startDate = new Date();
          const selectedPlan = SUBSCRIPTION_PLANS[subscription.plan];
          let expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + selectedPlan.months);
          
          subscription.paymentStatus = "paid";
          subscription.paymentId = paymentId;
          subscription.startDate = startDate;
          subscription.expiryDate = expiryDate;
          await subscription.save();

          await Doctor.findOneAndUpdate(
            { _id: subscription.doctorId },
            {
              $set: {
                subscriptionStatus: "active",
                subscriptionPlan: subscription.plan,
                subscriptionStartDate: startDate,
                subscriptionExpiryDate: expiryDate,
                subscriptionAmount: subscription.amount,
              },
            }
          );
        }
        return res.status(200).json({ success: true });
      }

    } else if (event === "payment.failed") {
      const appointment = await Appointment.findOne({ orderId });
      if (appointment && appointment.paymentStatus !== "paid") {
         appointment.paymentStatus = "failed";
         await appointment.save();
      }
      
      const subscription = await DoctorSubscription.findOne({ orderId });
      if (subscription && subscription.paymentStatus !== "paid") {
         subscription.paymentStatus = "failed";
         await subscription.save();
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
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
  razorpayWebhook,
};
