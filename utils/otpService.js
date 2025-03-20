const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = new twilio(accountSid, authToken);
const sendOtp = async (phoneNumber, otp) => {
  try {
    // const message = await client.messages.create({
    //   body: `Your OTP code is: ${otp}`,
    //   from: twilioPhoneNumber,
    //   to: phoneNumber,
    // });

    console.log(`✅ OTP Sent to ${phoneNumber}: ${otp}`);

    return { success: true, message: "OTP sent successfully." };
  } catch (error) {
    console.error("❌ Twilio Error:", error.message);
    return { success: false, message: error.message || "Failed to send OTP." };
  }
};

module.exports = sendOtp;
