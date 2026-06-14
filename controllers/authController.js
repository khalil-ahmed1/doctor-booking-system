const User = require("../models/User");

const registerUser = async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    // Check if mobile already exists
    const existingUser = await User.findOne({ mobile });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    const user = await User.create({
      name,
      mobile,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
};
