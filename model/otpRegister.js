const mongoose = require("mongoose");

const otpRegisterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true }, // Ensure phoneNumber is unique
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
});

const OtpRegister = mongoose.model("OtpRegister", otpRegisterSchema);

module.exports = OtpRegister;
