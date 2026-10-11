import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { Spinner } from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icons.jsx";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Business Administration (BBA/MBA)",
  "Economics",
  "Law & Human Rights",
  "International Relations (IR)",
  "Public Administration",
  "Information & Communication Engineering",
  "English",
  "Finance & Banking",
];

const PROGRAMS = [
  "B.Sc. in CSE",
  "Bachelor of Business Administration (BBA)",
  "LL.B. (Hons)",
  "BSS in Economics",
  "BSS in International Relations",
  "B.Sc. in ICE",
  "Master of Business Administration (MBA)",
  "M.Sc. in Computer Science",
];

const SEMESTERS = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester",
];

const FACULTY_DESIGNATIONS = [
  "Lecturer",
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Department Chair",
  "Adjunct Faculty",
];

const STAFF_OFFICE_DESIGNATIONS = [
  "Senior Systems Administrator",
  "Administrative Officer",
  "Accounts Specialist",
  "Assistant Registrar",
  "Library Officer",
  "Lab In-Charge",
];

const OFFICER_RANKS = [
  "Senior Section Officer",
  "Section Officer",
  "Assistant Director",
  "Deputy Director",
  "Director",
];

function passwordScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–4
}

export default function Signup() {
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    fullName: "",
    universityId: "",
    facultyId: "",
    officerId: "",
    staffId: "",
    universityEmail: "",
    personalEmail: "",
    department: "",
    program: "",
    semester: "",
    batch: "",
    designation: "",
    rank: "",
    office: "",
    officeDesignation: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { register, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  function set(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }



  const strength = passwordScore(form.password || "");
  const passwordsMatch = form.password && form.password === form.confirmPassword;

  const currentId =
    role === "student"
      ? form.universityId
      : role === "faculty"
      ? form.facultyId
      : role === "officer"
      ? form.officerId
      : form.staffId;

  const isValid = useMemo(() => {
    const nameOk = form.fullName.trim().length >= 2;
    const idOk = (currentId || "").trim().length >= 3;
    const personalEmailOk = /^\S+@\S+\.\S+$/.test((form.personalEmail || "").trim());
    const uniEmailOk = !form.universityEmail || /^\S+@\S+\.\S+$/.test(form.universityEmail.trim());
    const emailOk = personalEmailOk && uniEmailOk;
    const phoneOk = (form.phone || "").trim().length >= 8;
    const deptOk = !!form.department;
    const roleDetailsOk =
      role === "student"
        ? Boolean(form.program && form.semester)
        : role === "faculty"
        ? Boolean(form.designation)
        : role === "officer"
        ? Boolean(form.rank && form.office)
        : Boolean(form.officeDesignation);
    return nameOk && idOk && emailOk && phoneOk && deptOk && roleDetailsOk && passwordsMatch && strength >= 2;
  }, [form, currentId, role, passwordsMatch, strength]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    if (!form.personalEmail || !/^\S+@\S+\.\S+$/.test(form.personalEmail.trim())) {
      setSubmitError("Please enter a valid Email Address.");
      return;
    }
    if (form.universityEmail && !/^\S+@\S+\.\S+$/.test(form.universityEmail.trim())) {
      setSubmitError("Please enter a valid Official University Email format or leave it blank.");
      return;
    }
    if (!form.department) {
      setSubmitError("Please select your Department / Office.");
      return;
    }
    if (role === "student" && (!form.program || !form.semester)) {
      setSubmitError("Please select your Degree Program and Semester.");
      return;
    }
    if (role === "faculty" && !form.designation) {
      setSubmitError("Please select your Academic Designation.");
      return;
    }
    if (role === "officer" && (!form.rank || !form.office)) {
      setSubmitError("Please provide your Officer Rank and Office.");
      return;
    }
    if (role === "staff" && !form.officeDesignation) {
      setSubmitError("Please select your Staff Office Role.");
      return;
    }

    try {
      const res = await register({ role, ...form });
      if (res?.emailSent) {
        toast.success("Verification code sent to your email inbox!");
      } else {
        toast.info("Registration saved to database. Complete verification to activate account.");
      }
      navigate("/otp-verification");
    } catch (err) {
      setSubmitError(err.message || "Registration failed. Try again.");
    }
  }

  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["var(--brick)", "var(--mustard-dark)", "var(--teal)", "#10b981"];

  return (
    <>
      <Navbar />
      <div className="auth-shell">
        <div className="card auth-card" style={{ maxWidth: 560, textAlign: "left" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div className="auth-header-crest">
              <span className="crest-badge">
                <Icon name="graduationCap" size={20} color="#fff" />
              </span>
            </div>
            <h1>Create Campus Account</h1>
            <p className="sub">
              Register for smart cafeteria ordering and queue-free dining.
            </p>
          </div>



          {/* Role selector tabs */}
          <div className="select-tabs" style={{ marginBottom: 24 }}>
            <button
              type="button"
              className={role === "student" ? "active" : ""}
              onClick={() => {
                setRole("student");
                setSubmitError("");
                setForm((f) => ({
                  ...f,
                  facultyId: "",
                  officerId: "",
                  staffId: "",
                  designation: "",
                  rank: "",
                  office: "",
                  officeDesignation: "",
                }));
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="graduationCap" size={15} />
                <span>Student</span>
              </span>
            </button>
            <button
              type="button"
              className={role === "faculty" ? "active" : ""}
              onClick={() => {
                setRole("faculty");
                setSubmitError("");
                setForm((f) => ({
                  ...f,
                  universityId: "",
                  officerId: "",
                  staffId: "",
                  program: "",
                  semester: "",
                  rank: "",
                  office: "",
                  officeDesignation: "",
                }));
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="briefcase" size={15} />
                <span>Faculty</span>
              </span>
            </button>
            <button
              type="button"
              className={role === "officer" ? "active" : ""}
              onClick={() => {
                setRole("officer");
                setSubmitError("");
                setForm((f) => ({
                  ...f,
                  universityId: "",
                  facultyId: "",
                  staffId: "",
                  program: "",
                  semester: "",
                  designation: "",
                  officeDesignation: "",
                }));
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="shield" size={15} />
                <span>Officer</span>
              </span>
            </button>
            <button
              type="button"
              className={role === "staff" ? "active" : ""}
              onClick={() => {
                setRole("staff");
                setSubmitError("");
                setForm((f) => ({
                  ...f,
                  universityId: "",
                  facultyId: "",
                  officerId: "",
                  program: "",
                  semester: "",
                  designation: "",
                  rank: "",
                  office: "",
                }));
              }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Icon name="user" size={15} />
                <span>Univ Staff</span>
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Full Name</label>
              <input
                className="input"
                placeholder="e.g. Didar Ibn Firoz"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="field" style={{ flex: 1 }}>
                <label>
                  {role === "student"
                    ? "University Student ID"
                    : role === "faculty"
                    ? "Faculty ID"
                    : role === "officer"
                    ? "Officer ID"
                    : "Staff ID"}
                </label>
                <input
                  className="input"
                  placeholder={
                    role === "student"
                      ? "e.g. 23549009084"
                      : role === "faculty"
                      ? "e.g. FAC-204"
                      : role === "officer"
                      ? "e.g. OFF-301"
                      : "e.g. STF-102"
                  }
                  value={
                    role === "student"
                      ? form.universityId
                      : role === "faculty"
                      ? form.facultyId
                      : role === "officer"
                      ? form.officerId
                      : form.staffId
                  }
                  onChange={(e) =>
                    set(
                      role === "student"
                        ? "universityId"
                        : role === "faculty"
                        ? "facultyId"
                        : role === "officer"
                        ? "officerId"
                        : "staffId",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="field" style={{ flex: 1 }}>
                <label>Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="e.g. didar.personal@gmail.com"
                  value={form.personalEmail}
                  onChange={(e) => set("personalEmail", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field" style={{ flex: 1 }}>
                <label>Official University Email (Optional)</label>
                <input
                  type="email"
                  className="input"
                  placeholder={
                    role === "student"
                      ? "e.g. didar23549009084@stu.bup.edu.bd"
                      : role === "faculty"
                      ? "e.g. farhana.faculty@bup.edu.bd"
                      : role === "officer"
                      ? "e.g. rafiq.officer@bup.edu.bd"
                      : "e.g. anwar.staff@bup.edu.bd"
                  }
                  value={form.universityEmail}
                  onChange={(e) => set("universityEmail", e.target.value)}
                />
              </div>

              <div className="field" style={{ flex: 1 }}>
                <label>Contact Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="e.g. 01712-345678"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Department dropdown - starts empty without any preselected example */}
            <div className="field">
              <label>Academic Department</label>
              <select
                className={`input ${!form.department ? "select-placeholder" : ""}`}
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                required
              >
                <option value="" disabled hidden>
                  -- Select Academic Department --
                </option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {role === "student" && (
              <div className="form-row">
                <div className="field" style={{ flex: 1 }}>
                  <label>Degree Program</label>
                  <select
                    className={`input ${!form.program ? "select-placeholder" : ""}`}
                    value={form.program}
                    onChange={(e) => set("program", e.target.value)}
                    required
                  >
                    <option value="" disabled hidden>
                      -- Select Degree Program --
                    </option>
                    {PROGRAMS.map((prog) => (
                      <option key={prog} value={prog}>
                        {prog}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field" style={{ flex: 1 }}>
                  <label>Current Semester</label>
                  <select
                    className={`input ${!form.semester ? "select-placeholder" : ""}`}
                    value={form.semester}
                    onChange={(e) => set("semester", e.target.value)}
                    required
                  >
                    <option value="" disabled hidden>
                      -- Select Semester --
                    </option>
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {role === "faculty" && (
              <div className="field">
                <label>Academic Designation</label>
                <select
                  className={`input ${!form.designation ? "select-placeholder" : ""}`}
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                  required
                >
                  <option value="" disabled hidden>
                    -- Select Academic Designation --
                  </option>
                  {FACULTY_DESIGNATIONS.map((desig) => (
                    <option key={desig} value={desig}>
                      {desig}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {role === "officer" && (
              <div className="form-row">
                <div className="field" style={{ flex: 1 }}>
                  <label>Administrative Rank</label>
                  <select
                    className={`input ${!form.rank ? "select-placeholder" : ""}`}
                    value={form.rank}
                    onChange={(e) => set("rank", e.target.value)}
                    required
                  >
                    <option value="" disabled hidden>
                      -- Select Officer Rank --
                    </option>
                    {OFFICER_RANKS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field" style={{ flex: 1 }}>
                  <label>Assigned Office / Branch</label>
                  <input
                    className="input"
                    placeholder="e.g. Registrar Office"
                    value={form.office}
                    onChange={(e) => set("office", e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {role === "staff" && (
              <div className="field">
                <label>Staff Office Role</label>
                <select
                  className={`input ${!form.officeDesignation ? "select-placeholder" : ""}`}
                  value={form.officeDesignation}
                  onChange={(e) => set("officeDesignation", e.target.value)}
                  required
                >
                  <option value="" disabled hidden>
                    -- Select Staff Office Role --
                  </option>
                  {STAFF_OFFICE_DESIGNATIONS.map((desig) => (
                    <option key={desig} value={desig}>
                      {desig}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Password with strength meter */}
            <div className="field">
              <label>Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="e.g. At least 8 characters (mixed case & numbers)"
                  required
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={17} />
                </button>
              </div>

              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div className="strength-meter">
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        style={{
                          background: i < strength ? strengthColors[strength - 1] : undefined,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.75rem" }}>
                    <span style={{ color: strengthColors[Math.max(0, strength - 1)], fontWeight: 600 }}>
                      Strength: {strengthLabels[Math.max(0, strength - 1)]}
                    </span>
                    <span style={{ color: "var(--ink-soft)" }}>8+ chars, mix letters/numbers</span>
                  </div>
                </div>
              )}
            </div>

            <div className="field">
              <label>Confirm Password</label>
              <div className="input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input ${form.confirmPassword && !passwordsMatch ? "has-error" : ""}`}
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="e.g. Re-enter your password to match"
                  required
                />
              </div>
              {form.confirmPassword && !passwordsMatch && (
                <p className="field-error">
                  <Icon name="alertCircle" size={13} />
                  <span>Passwords do not match.</span>
                </p>
              )}
              {form.confirmPassword && passwordsMatch && (
                <p style={{ fontSize: "0.78rem", color: "var(--teal-dark)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="checkCircle" size={13} />
                  <span>Passwords match!</span>
                </p>
              )}
            </div>

            {submitError && (
              <p className="field-error" style={{ marginBottom: 16 }}>
                <Icon name="alertCircle" size={14} />
                <span>{submitError}</span>
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={!isValid || loading}
            >
              {loading ? <Spinner /> : "Register & Receive Verification Code"}
            </button>
          </form>

          <p className="auth-foot" style={{ textAlign: "center", marginTop: 22 }}>
            Already have an account? <Link to="/login">Log in here</Link>
          </p>
        </div>
      </div>
    </>
  );
}
