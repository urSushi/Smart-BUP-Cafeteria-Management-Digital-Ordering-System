# Smart BUP Cafeteria Management & Digital Ordering System (SBCMS)

A web-based cafeteria management project designed to modernize food ordering and cafeteria operations at Bangladesh University of Professionals (BUP).

## Overview

The **Smart BUP Cafeteria Management & Digital Ordering System (SBCMS)** aims to make campus dining more convenient by reducing unnecessary queues and streamlining cafeteria services through a unified digital platform.

The system is designed to support BUP's four cafeteria locations: Vista, Amitie, Third Place, and PitStop. It aims to provide students with easier access to cafeteria information while giving cafeteria staff, managers, and university administrators dedicated interfaces for their respective responsibilities.

This repository currently contains **Module 1: Authentication & Landing Experience**, which establishes the application's landing page, authentication workflows, user sessions, and role-specific portals as the foundation for future modules.

## Current Features

- **Responsive Landing Page:** Introduces the system, its features, and available cafeterias.
- **User Registration:** Supports role-based registration for students, faculty, and university staff.
- **Secure Authentication:** Implements password-based login and email-based OTP verification.
- **OTP Verification:** Supports one-time password verification, resend cooldowns, and expiration handling.
- **Guest Accounts:** Allows visitors to create temporary accounts with a seven-day validity period after verification.
- **Role-Based Portals:** Provides separate login interfaces for cafeteria staff, managers, and administrators.
- **Protected Routes:** Restricts access to designated pages based on authentication and user roles.
- **Session Management:** Uses JSON Web Tokens (JWT) and browser local storage to maintain login sessions.
- **Cafeteria Selection:** Displays the four cafeteria options after login.
- **API-Ready Architecture:** Separates frontend services, backend routes, controllers, middleware, and models to support future development.

## Planned Features

The following features are part of the broader SBCMS project and may be implemented in subsequent modules:

- Live cafeteria menus, prices, and item availability.
- Shopping cart and advance food ordering.
- Digital payments through bKash and Nagad sandbox integrations.
- Pay-at-counter support.
- Automatic order token and QR code generation.
- Order tracking and pickup verification.
- Inventory management and low-stock alerts.
- Staff order-processing dashboards.
- Sales analytics, reports, and cafeteria management tools.
- Customer reviews and ratings.
- Notifications for order status updates.

> **Development status:** The current module focuses on the landing experience, authentication, and user portals. Some interfaces and cafeteria information use mock data, and the backend uses in-memory models. The planned features above should not be considered fully implemented.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Routing | React Router |
| Backend | Node.js |
| API Framework | Express.js |
| Authentication | JSON Web Tokens (JWT) |
| Password Hashing | bcryptjs |
| OTP Email Delivery | Nodemailer |
| Configuration | dotenv |
| API Communication | REST API |
| Version Control | Git and GitHub |

## Project Structure

```text
sbcms-module1/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── server/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) (with npm)
- [Git](https://git-scm.com/)
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/)

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd sbcms-module1
```

Replace `<YOUR_REPOSITORY_URL>` with your GitHub repository URL.

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` as a reference.

Configure the required environment variables, including a strong JWT secret and any required email settings.

Start the backend development server:

```bash
npm run dev
```

The backend is configured to run at:

`http://localhost:5000`

### 3. Set Up the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create a `.env` file using `.env.example` as a reference. Configure `VITE_API_BASE_URL` to point to the backend authentication API. The default API base URL is:

`http://localhost:5000/api/auth`

Start the frontend development server:

```bash
npm run dev
```

Open the local URL printed by Vite, typically:

`http://localhost:5173`

Keep both development servers running while using the application.

## Authentication Workflow

The authentication module follows this general workflow:

1. A user registers or selects an available login method.
2. The backend validates the submitted information.
3. An OTP is generated and delivered through the configured email service, or displayed in the backend console during development.
4. The user submits the OTP for verification.
5. After successful verification, the backend issues a JWT.
6. The frontend stores the authenticated session and grants access to the appropriate pages.
7. Protected routes enforce authentication and role-based access restrictions.

Guest accounts become active after successful verification and expire after seven days.

## Development Notes

- **Database:** The current module uses in-memory data stores. User and session-related data may not persist across backend restarts.
- **Email configuration:** SMTP settings are required for actual email delivery. Without SMTP configuration, development OTPs are printed in the backend console.
- **Cafeteria information:** Some cafeteria details and landing-page content are provided through mock data.
- **Demo accounts:** Operational portals may use seeded development accounts. Check the backend model configuration for the current credentials, and replace all default credentials before deployment.
- **Payments and ordering:** Full payment processing and the complete cafeteria ordering workflow belong to the broader project scope and are not established by this module alone.

## Security Considerations

- Keep `.env` files and real credentials out of version control.
- Use strong, unique JWT secrets and operational account passwords.
- Configure HTTPS for production deployment.
- Configure email delivery and appropriate OTP expiration and rate limits.
- Replace in-memory storage with a persistent database before production use.
- Review authentication, authorization, and session handling before public deployment.

## Future Development

SBCMS is intended to evolve into a complete cafeteria management platform by integrating menu management, inventory tracking, digital ordering, payments, pickup verification, and operational analytics.

The modular architecture is intended to help these features be developed and integrated incrementally.

## Academic Project

**Project Name:** Smart BUP Cafeteria Management & Digital Ordering System (SBCMS)  
**Institution:** Bangladesh University of Professionals (BUP)  
**Department:** Information and Communication Technology (ICT)  
**Project Type:** Academic Software Development Project

### Project Team

- Md. Mahim Rana
- Didar Ibn Firoz
- Rukaiya Binte Iqbal

### Supervisors

- Nazneen Akhter — Assistant Professor, Department of ICT, FST, BUP
- Suman Saha — Assistant Professor, Department of IT & RE, FCPSE, University of Frontier Technology, Bangladesh

---

**SBCMS — Making campus dining smarter, simpler, and more efficient.**
