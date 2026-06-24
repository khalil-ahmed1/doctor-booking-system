const Support = require("../models/Support");

const createSupportTicket = async (req, res) => {
  try {
    const ticket = await Support.create(req.body);

    res.status(201).json({
      success: true,
      message: "Support request submitted",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSupportTickets = async (req, res) => {
  try {
    const tickets = await Support.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSupportTicket,
  getSupportTickets,
};
