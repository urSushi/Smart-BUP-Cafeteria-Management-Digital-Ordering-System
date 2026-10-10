import "dotenv/config";
import { issueOtp } from "./server/models/OTP.js";
import { sendOTP, getTransporter } from "./server/utils/sendOTP.js";

const targetEmail = process.argv[2] || "didar23549009084@stu.bup.edu.bd";

console.log("====================================================================");
console.log("   SMART BUP CAFETERIA MANAGEMENT SYSTEM — LIVE EMAIL TESTER        ");
console.log("====================================================================");
console.log(`Target Recipient: ${targetEmail}`);
console.log(`Configured SMTP_USER: ${process.env.SMTP_USER || "(none - please set in backend/.env)"}`);

const transporter = getTransporter();
if (!transporter) {
  console.log("\n[NOTICE] SMTP is not configured in backend/.env yet.");
  console.log("To send real emails to your University inbox directly:");
  console.log("1. Open backend/.env");
  console.log("2. Set SMTP_USER=your_email@gmail.com");
  console.log("3. Set SMTP_PASS=your_16_character_app_password");
  console.log("--------------------------------------------------------------------\n");
}

try {
  const code = issueOtp(targetEmail, "register");
  console.log(`Generated Actual 6-Digit Combination: [ ${code} ]`);
  console.log("Dispatching email...");

  const result = await sendOTP(targetEmail, code, "register");
  if (result.sent) {
    console.log(`\nSUCCESS! Real email with OTP [${code}] dispatched to: ${targetEmail}`);
    console.log(`Message ID: ${result.messageId}`);
    console.log("Please check your University Email inbox (and spam/junk folder).");
  } else {
    console.log(`\nEmail was not dispatched over network: ${result.reason}`);
    console.log(`For local verification, the code generated is: ${code}`);
  }
} catch (err) {
  console.error("\nFAILED to send email:", err.message);
  if (err.message.includes("Username and Password not accepted") || err.message.includes("Invalid login")) {
    console.error("Tip: For Gmail, use an App Password, not your standard Google login password.");
  }
}
