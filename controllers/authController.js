const User = require("../models/User");
const generateToken = require("../config/generateToken");
const bcrypt = require("bcryptjs");
const registerUser = async (req, res) => {
  try {
  const { name, mobile, email, password, role } = req.body;

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
    role: role || "patient",
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


const loginUser = async (req, res) => {
  try {
const { mobile, password } = req.body;

console.log("Mobile received:", mobile);
const user = await User.findOne({ mobile });

console.log("User found:", user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.status(200).json({
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
  loginUser,
  getProfile,
};