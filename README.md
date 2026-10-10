# Smart University Cafeteria — Module 1: Authentication & Landing Experience

Two folders, two apps:

```
sbcms-module1/
  frontend/   React (JavaScript, Vite) — landing page, auth, OTP, portals
  backend/    Node.js + Express — auth, OTP, guest-account API
```

This is **Module 1 only**: landing page, navbar, registration, login (two
methods), OTP verification, guest accounts, three separate operational
portals, and the post-login cafeteria-selection screen. No ordering, menu,
payments, or reviews yet — those are future modules, and the folder
structure below is deliberately shaped so they can plug in without
refactoring this one.

> Note: there's an existing TypeScript/Vite prototype in this project
> (desktop-first, built from a Figma design, already covering menu/cart/
> orders) that this module does not touch or depend on — this is a fresh
> build in plain JavaScript per the Module 1 spec.

## Quick start

**Backend** (http://localhost:5000):
```bash
cd backend
npm install
cp .env.example .env      # fill in JWT_SECRET at minimum
npm run dev
```

**Frontend** (http://localhost:5173):
```bash
cd frontend
npm install
cp .env.example .env      # defaults already point at localhost:5000
npm run dev
```

There's no database to set up — Module 1 runs entirely on the in-memory
models described below, so `npm install && npm run dev` in each folder is
the whole setup.

### Demo operational accounts

The staff/manager/admin portals have no self-registration, so three demo
accounts are seeded automatically when the backend starts:

| Portal  | Route            | ID        | Password      |
|---------|------------------|-----------|---------------|
| Staff   | `/staff/login`   | `STF-001` | `password123` |
| Manager | `/manager/login` | `MGR-001` | `password123` |
| Admin   | `/admin/login`   | `ADM-001` | `password123` |

Change these before any real deployment (see `seedOperationalAccount` in
`backend/server/models/User.js`).

### Testing OTP without email

No SMTP is configured by default, so every OTP is printed to the backend's
console (`[DEV OTP] ... code for ... : 123456`) instead of emailed. Fill in
the `SMTP_*` variables in `backend/.env` to send real emails via
`nodemailer` — nothing else in the code needs to change.

## Integration notes

- The frontend's only network surface is `frontend/src/services/authService.js`.
  It reads `VITE_API_BASE_URL` (defaults to `http://localhost:5000/api/auth`)
  and exposes one function per endpoint — pages and `AuthContext` never call
  `fetch` directly.
- `AuthContext` persists `{ token, user, role }` to `localStorage` under
  `sbcms_session` and restores it on load, so a refresh doesn't log anyone out.
- `ProtectedRoute` redirects to `/login` when unauthenticated, and can take
  `allowedRoles={["admin"]}` for role-gated routes once those pages exist.
- The backend has no real database — `server/models/*.js` are in-memory
  stores shaped like the eventual data-access layer (`createUser`,
  `findUserByEmail`, etc.). Swapping in MongoDB/Mongoose means rewriting the
  function bodies in those three files only; every controller, route, and
  the frontend stay unchanged.
- Cafeteria data (`frontend/src/data/cafeterias.js`) and the landing page's
  info cards are mocked but shaped like a future `GET /api/cafeterias`
  response, per the spec's "API-ready" requirement. The four cafeteria
  photos you provided are mapped as: Vista → `Vista.jpeg`, Amitie →
  `Amitie.jpeg`, Pitstop → `PitStop.jpeg`, and Monpura → `3rd Place.jpeg`
  (the one remaining photo for the one remaining cafeteria) — double-check
  that last mapping and rename the file if it's wrong.

## Frontend component/page guide

| File | Purpose |
|---|---|
| `context/AuthContext.jsx` | Session state machine: `idle → otp_pending → verified → authenticated`. Wraps every `authService` call and persists the session. |
| `context/ToastContext.jsx` | Toast notifications, used app-wide via `useToast()`. |
| `services/authService.js` | The only place `fetch` is called — one function per API endpoint. |
| `routes/ProtectedRoute.jsx` | Redirects unauthenticated visitors to `/login`; supports role gating. |
| `components/Navbar.jsx` | Responsive nav with distinct before/after-login link sets and a mobile hamburger panel. |
| `components/Hero.jsx` | Landing hero: headline, CTAs, animated gradient, CSS "tray" collage standing in for illustration assets. |
| `components/OTPModal.jsx` | Self-contained 6-digit input with a 5-minute expiry countdown and 30-second resend cooldown. |
| `components/CafeteriaCard.jsx` | Cafeteria tile with image, open/closed badge, queue estimate, hover zoom. |
| `components/FeatureCard.jsx` | Icon + title + description tile for the landing page's feature section. |
| `components/Loader.jsx` | `Spinner`, `Skeleton`, and skeleton variants for info/cafeteria cards while "loading". |
| `pages/Landing.jsx` | Public homepage: hero, mocked info cards, cafeteria preview, feature grid. |
| `pages/Login.jsx` | Tabbed login: University ID + password, or email OTP. |
| `pages/Signup.jsx` | Role-tabbed registration (Student / Faculty / University Staff) with a config-driven field set, password strength meter, and confirm-password check. |
| `pages/GuestSignup.jsx` | Guest temporary-account form; explains the 7-day expiry. |
| `pages/OTPVerification.jsx` | Shared OTP screen for register/login/guest, driven by `AuthContext`'s `pendingAuth`. |
| `pages/Home.jsx` | Post-login cafeteria-selection screen (four cards). |
| `pages/StaffLogin.jsx` / `ManagerLogin.jsx` / `AdminLogin.jsx` | Separate portals with a distinct, sober dark theme (`.portal-shell`) so they read as operational, not student-facing. |

## Backend endpoint guide

| Method | Endpoint | Controller | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | `authController.register` | Role-specific validation, creates an unverified user, sends a registration OTP. |
| POST | `/api/auth/login` | `authController.login` | University ID + password, for verified student/faculty/staff accounts. |
| POST | `/api/auth/send-otp` | `otpController.sendOtp` | Body: `{ email, purpose }`, `purpose` ∈ `register` \| `login` \| `guest`. Enforces the 30s resend cooldown. |
| POST | `/api/auth/verify-otp` | `otpController.verifyOtp` | Marks the account verified (or activates a guest) and returns a JWT — matches the spec's `Verified → JWT Created → Authenticated` flow. |
| POST | `/api/auth/guest-register` | `guestController.guestRegister` | Creates a `pending_otp` guest; becomes `active` with a 7-day `expiresAt` once verified. |
| POST | `/api/auth/staff/login` | `authController.staffLogin` | Separate credential check against `role: "cafeteria_staff"`. |
| POST | `/api/auth/manager/login` | `authController.managerLogin` | Separate credential check against `role: "cafeteria_manager"`. |
| POST | `/api/auth/admin/login` | `authController.adminLogin` | Separate credential check against `role: "admin"`. |

`middleware/authMiddleware.js` verifies the JWT and loads the user (or
guest, checking expiry) onto `req.user`; `middleware/roleMiddleware.js`'s
`requireRole(...)` is ready for future protected routes.
