import React, { useEffect, useRef, useState } from "react";
import { Spinner } from "./Loader.jsx";
import Icon from "./Icons.jsx";

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 5 * 60;
const RESEND_COOLDOWN = 30;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function OTPModal({
  email,
  personalEmail = null,
  universityEmail = null,
  purpose = "register",
  onVerify,
  onResend,
  loading,
  error,
  isDemo = false,
  devOtp = null,
  emailSent = false,
}) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [resendIn, setResendIn] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef([]);

  // Demo is strictly applicable in signin/login option — NEVER in signup/registration!
  const isDemoUser =
    purpose === "login" &&
    (Boolean(isDemo) ||
      [
        "student@bup.edu.bd",
        "faculty@bup.edu.bd",
        "officer@bup.edu.bd",
        "staff@bup.edu.bd",
        "guest@bup.edu.bd",
        "admin@bup.edu.bd",
      ].includes(String(email).trim().toLowerCase()) ||
      String(email).toLowerCase().includes("demo"));

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const expired = secondsLeft <= 0;

  function fillCode(codeToFill) {
    if (!codeToFill) return;
    const clean = String(codeToFill).trim().slice(0, OTP_LENGTH);
    const newDigits = Array.from({ length: OTP_LENGTH }, (_, i) => clean[i] || "");
    setDigits(newDigits);
    inputRefs.current[Math.min(clean.length, OTP_LENGTH - 1)]?.focus();
    if (clean.length === OTP_LENGTH && !expired) {
      onVerify(clean);
    }
  }

  function handleChange(index, value) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if fully typed
    if (clean && index === OTP_LENGTH - 1) {
      const fullCode = next.join("");
      if (fullCode.length === OTP_LENGTH && !expired) {
        onVerify(fullCode);
      }
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const newDigits = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || "");
    setDigits(newDigits);
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();

    if (pasted.length === OTP_LENGTH && !expired) {
      onVerify(pasted);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length === OTP_LENGTH && !expired) {
      onVerify(code);
    }
  }

  function handleResend() {
    if (resendIn > 0) return;
    setDigits(Array(OTP_LENGTH).fill(""));
    setSecondsLeft(EXPIRY_SECONDS);
    setResendIn(RESEND_COOLDOWN);
    onResend();
  }

  const isComplete = digits.every((d) => d !== "");

  return (
    <form onSubmit={handleSubmit}>
      <p className="sub" style={{ margin: "14px auto 14px", lineHeight: 1.5 }}>
        We sent a 6-digit verification code to <br />
        <strong style={{ color: "var(--ink)" }}>{email}</strong>
        {universityEmail && universityEmail.toLowerCase() !== email?.toLowerCase() && (
          <>
            <br />
            <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              &amp; official university email: <strong style={{ color: "var(--ink)" }}>{universityEmail}</strong>
            </span>
          </>
        )}
        {personalEmail && personalEmail.toLowerCase() !== email?.toLowerCase() && (
          <>
            <br />
            <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
              &amp; designated personal email: <strong style={{ color: "var(--ink)" }}>{personalEmail}</strong>
            </span>
          </>
        )}
      </p>

      {/* Real-time Status Badge */}
      {emailSent ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 20,
            background: "var(--teal-tint)",
            color: "var(--teal)",
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          <Icon name="checkCircle" size={14} color="var(--teal)" />
          <span>Dispatched live to {universityEmail && personalEmail ? "both email inboxes" : "email inbox"}</span>
        </div>
      ) : (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 20,
            background: "rgba(15, 118, 110, 0.08)",
            color: "var(--teal)",
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          <Icon name="shield" size={14} color="var(--teal)" />
          <span>Two-step security verification active</span>
        </div>
      )}

      {/* Demo Account Helper Banner */}
      {isDemoUser && (
        <div className="otp-helper-badge otp-helper-demo">
          <div style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
            <Icon name="shield" size={16} color="var(--teal)" />
            <span>
              Demo Account: Code is <strong style={{ letterSpacing: 2, color: "var(--teal)" }}>123456</strong>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fillCode("123456")}
            style={{ padding: "4px 10px", fontSize: "0.78rem", fontWeight: 700 }}
          >
            Fill Demo Code
          </button>
        </div>
      )}

      {/* Real account dev-mode helper when SMTP is unconfigured */}
      {!isDemoUser && devOtp && (
        <div className="otp-helper-badge otp-helper-dev">
          <div style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
            <Icon name="checkCircle" size={16} color="var(--teal)" />
            <span>
              Real-time DB Code: <strong style={{ letterSpacing: 2 }}>{devOtp}</strong>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => fillCode(devOtp)}
            style={{ padding: "4px 10px", fontSize: "0.78rem", fontWeight: 700 }}
          >
            Fill Code
          </button>
        </div>
      )}

      <div className="otp-group" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            className={`otp-digit-input ${error ? "has-error" : ""} ${d ? "filled" : ""}`}
            inputMode="numeric"
            maxLength={1}
            value={d}
            disabled={expired || loading}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`Digit ${i + 1} of 6`}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {error && (
        <p className="field-error" style={{ textAlign: "center", margin: "12px 0 6px" }}>
          <Icon name="alertCircle" size={14} />
          <span>{error}</span>
        </p>
      )}

      <p className="otp-timer">
        {expired ? (
          <span style={{ color: "var(--brick)", fontWeight: 600 }}>
            Code expired. Please request a new one below.
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="clock" size={14} color="var(--teal)" />
            <span>
              Code expires in <strong>{formatTime(secondsLeft)}</strong>
            </span>
          </span>
        )}
      </p>

      <button
        type="submit"
        className="btn btn-primary btn-block btn-lg"
        disabled={!isComplete || expired || loading}
      >
        {loading ? <Spinner /> : "Verify & Continue"}
      </button>

      <p className="auth-foot" style={{ marginTop: 20 }}>
        Didn't receive the email?{" "}
        {resendIn > 0 ? (
          <span style={{ color: "var(--ink-soft)", fontWeight: 600 }}>
            Resend in {resendIn}s
          </span>
        ) : (
          <button
            type="button"
            className="field-action-link"
            onClick={handleResend}
            style={{ fontWeight: 700 }}
          >
            Resend code now
          </button>
        )}
      </p>
    </form>
  );
}
