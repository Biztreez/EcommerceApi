const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const User = require("../model/user");
const sendOtp = require("../utils/otpService");
const OtpRegister = require("../model/otpRegister");

//Otp Register
router.post("/send-otp", async (req, res) => {
  const { name, phoneNumber } = req.body;

  if (!name || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "Name and phone number are required.",
    });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    console.log("🔹 Checking if phone number exists in database...");
    let otpRecord = await OtpRegister.findOne({ phoneNumber });

    if (otpRecord) {
      console.log("🔹 Existing OTP record found, updating...");
      otpRecord.otp = otp;
      otpRecord.otpExpires = otpExpires;
      await otpRecord.save();
      console.log("✅ OTP updated in MongoDB:", otpRecord);
    } else {
      console.log("🔹 No existing OTP record, creating a new entry...");
      otpRecord = new OtpRegister({ name, phoneNumber, otp, otpExpires });
      await otpRecord.save();
      console.log("✅ New OTP record saved in MongoDB:", otpRecord);
    }

    // Retrieve latest OTP from database
    const latestOtpRecord = await OtpRegister.findOne({ phoneNumber });

    // Send OTP via Twilio
    const otpResponse = await sendOtp(phoneNumber, otp);

    if (!otpResponse || !otpResponse.success) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP." });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      otp: latestOtpRecord.otp,
      phoneNumber: latestOtpRecord.phoneNumber,
    });
  } catch (error) {
    console.error("❌ Error saving OTP in MongoDB:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send OTP." });
  }
});

// Verify OTP Route
router.post("/verify-otp", async (req, res) => {
  const { name, phoneNumber, otp } = req.body;

  if (!name || !phoneNumber || !otp) {
    return res.status(400).json({
      success: false,
      message: "Name, phone number, and OTP are required.",
    });
  }

  try {
    // Find OTP record from database
    const otpRecord = await OtpRegister.findOne({ phoneNumber, name });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found for this phone number and name.",
      });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.otpExpires) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired." });
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    // OTP verified successfully
    res.json({ success: true, message: "OTP verified successfully." });

    // Optionally, remove OTP record from the database after successful verification
    await OtpRegister.deleteOne({ phoneNumber });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
});

//Get OtpRegister Users
router.get("/get-otp-users", async (req, res) => {
  try {
    const users = await OtpRegister.find(
      {},
      { name: 1, phoneNumber: 1, _id: 1 }
    ); // Fetch users without OTP
    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching OTP registered users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
});

// Get all users
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const users = await User.find();
      res.json({
        success: true,
        message: "Users retrieved successfully.",
        data: users,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// login
router.post("/login", async (req, res) => {
  const { name, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ name });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }
    // Check if the password is correct
    if (user.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    // Authentication successful
    res
      .status(200)
      .json({ success: true, message: "Login successful.", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a user by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const userID = req.params.id;
      const user = await User.findById(userID);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      res.json({
        success: true,
        message: "User retrieved successfully.",
        data: user,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new user
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Name, and password are required." });
    }
    const existingUser = await User.findOne({ name });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    try {
      const user = new User({ name, password });
      const newUser = await user.save();
      res.json({
        success: true,
        message: "User created successfully.",
        data: newUser,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);
10;
// Update a user
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const userID = req.params.id;
      const { name, password } = req.body;
      if (!name || !password) {
        return res.status(400).json({
          success: false,
          message: "Name,  and password are required.",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userID,
        { name, password },
        { new: true }
      );

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      res.json({
        success: true,
        message: "User updated successfully.",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Delete a user
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const userID = req.params.id;
      const deletedUser = await User.findByIdAndDelete(userID);
      if (!deletedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }
      res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
