const razorpay = require("../config/razorpay");
const Appointment = require("../models/Appointment");
const crypto = require("crypto");

const createOrder = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Amount in paise (₹500 = 50000 paise)
    const amount = appointment.amountPaid * 100;

    const options = {
      amount,
      currency: "INR",
      receipt: appointment.bookingReference,
    };

    const order = await razorpay.orders.create(options);

    // Save Order ID
    appointment.orderId = order.id;
    await appointment.save();

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
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

    // Verify Signature
    const crypto = require("crypto");

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

    // Find Appointment
    const appointment = await Appointment.findOne({
      orderId: razorpay_order_id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Prevent Duplicate Payment
    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed",
      });
    }

    // Update Appointment
   appointment.paymentStatus = "paid";
   appointment.status = "confirmed";

   appointment.paymentId = razorpay_payment_id;
   appointment.orderId = razorpay_order_id;
   appointment.paymentMethod = "razorpay";
   appointment.paymentCompletedAt = new Date();

   await appointment.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
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
  createOrder,
  verifyPayment,
};
