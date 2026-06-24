const Faq = require("../models/Faq");

const createFaq = async (req, res) => {
  try {
    const faq = await Faq.create(req.body);

    res.status(201).json({
      success: true,
      faq,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: faqs.length,
      faqs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createFaq,
  getFaqs,
};
