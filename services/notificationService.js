const Notification = require("../models/Notification");

const sendNotification = async (
  receiverId,
  title,
  message,
  type = "appointment",
) => {
  try {
    await Notification.create({
      receiverId,
      title,
      message,
      type,
    });

    console.log("✅ Notification Created");
  } catch (error) {
    console.error("Notification Error:", error.message);
  }
};

module.exports = sendNotification;
