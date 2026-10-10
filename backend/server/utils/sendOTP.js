import nodemailer from "nodemailer";

/**
 * Creates or retrieves a nodemailer transporter based on current environment variables.
 * Supports:
 * - Gmail via service: 'gmail' or SMTP_HOST=smtp.gmail.com
 * - Outlook/Office365 (e.g. smtp.office365.com)
 * - Custom SMTP (Host, Port, User, Pass)
 */
export function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const service = process.env.SMTP_SERVICE;

  if (!user || !pass) {
    return null;
  }

  // Auto-detect Gmail setup if user is a @gmail.com address or service=gmail or host=smtp.gmail.com
  if (service === "gmail" || host === "smtp.gmail.com" || user.toLowerCase().endsWith("@gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Generic custom SMTP / Outlook / Office365
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: host || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Sends an actual 6-digit combination code to `email` (string or array of emails).
 * If SMTP credentials are configured, it sends a beautifully styled HTML email
 * directly to the user's university inbox and/or designated personal email.
 */
export async function sendOTP(email, code, purpose = "verification") {
  const transporter = getTransporter();
  const emailList = Array.isArray(email) ? email.filter(Boolean) : [email].filter(Boolean);
  const toAddresses = emailList.join(", ");

  console.log("\n====================================================================");
  console.log(`[SBCMS VERIFICATION SYSTEM]`);
  console.log(`Target Email(s): ${toAddresses}`);
  console.log(`>>> ACTUAL 6-DIGIT OTP COMBINATION: [ ${code} ] <<<`);
  console.log(`Valid for 5 minutes | Purpose: ${purpose}`);
  if (!transporter) {
    console.log("--------------------------------------------------------------------");
    console.log("STATUS: Email dispatch pending SMTP credentials in backend/.env");
    console.log("REASON: SMTP_USER and SMTP_PASS are empty in backend/.env.");
    console.log("ACTION: Add your Gmail + App Password in backend/.env to send live emails.");
  } else {
    console.log(`STATUS: Dispatching live email directly to [${toAddresses}] via SMTP relay...`);
  }
  console.log("====================================================================\n");

  if (!transporter) {
    return { sent: false, code, reason: "SMTP credentials not provided in .env" };
  }

  const purposeTitle =
    purpose === "register"
      ? "Registration Verification"
      : purpose === "login"
      ? "Login Two-Factor Authentication"
      : "Guest Access Activation";

  const sender = process.env.SMTP_FROM || `"Smart BUP Cafeteria" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #006a4e 0%, #115e59 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Smart BUP Cafeteria</h1>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; color: #e6f4f1;">Digital Ordering & Cafeteria Management System</p>
      </div>
      <div style="padding: 32px 28px;">
        <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">${purposeTitle}</h2>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
          Hello, we received a request to verify your account (${toAddresses}) on the Smart BUP Cafeteria portal.
        </p>
        <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0f766e; letter-spacing: 1px; margin-bottom: 8px;">
            Your 6-Digit One-Time Password
          </div>
          <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #006a4e; font-family: Consolas, Monaco, monospace; padding: 6px 0;">
            ${code}
          </div>
          <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">
            Valid for <strong>5 minutes</strong>. Do not share this code with anyone.
          </p>
        </div>
        <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
          If you did not make this request, you can safely disregard this email. Your account remains secure.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} Bangladesh University of Professionals (BUP) · Smart Cafeteria System
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: sender,
      to: toAddresses,
      subject: `${code} is your Smart BUP Cafeteria Verification Code`,
      text: `Your Smart BUP Cafeteria verification code is: ${code}. It expires in 5 minutes.`,
      html: htmlContent,
    });
    console.log(`[SBCMS EMAIL SUCCESS] Verification code sent to ${toAddresses} (MessageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[SBCMS EMAIL ERROR] Failed to send email to ${toAddresses}:`, err.message);
    throw err;
  }
}
