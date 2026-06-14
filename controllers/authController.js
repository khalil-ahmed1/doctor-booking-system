const User = require("../models/User");
const bcrypt = require("bcryptjs");
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
const salt = await bcrypt.genSalt(10);

const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      name,
      mobile,
      email,
      password: hashedPassword,
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
