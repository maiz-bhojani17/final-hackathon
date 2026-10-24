# HCM Lite — AI-Assisted Human Capital Management System

> **Saylani Hackathon — Challenge Brief Project**  
> Complete web-based Human Capital Management (HCM) system for **Admin**, **HR**, and **Employee** roles with **Google Gemini AI Tool-Calling** integration, strict server-side role & data-scope guards, immutable append-only audit trail, and biometric/geofence attendance verification.

---

## 🌟 Tech Stack

- **Backend**: Node.js & Express, MongoDB with Mongoose ODM, JWT authentication, bcryptjs, express-validator, PDFKit (PDF payslip generation), Geolib (haversine geofence check), Multer & csv-parse (CSV dry-run and bulk import), csv-stringify (export).
- **Frontend**: React 18, Vite, Tailwind CSS with full Dark Mode support, React Router v6, Axios, Recharts (KPI visualizations), Lucide React icons. Responsive from 375px mobile screens to desktop.
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`) with function/tool calling called strictly from the backend. Includes fallback heuristic processor, intelligent rate-limiter (~20 req/user/hr), and support for Roman Urdu.

---

## 🚀 Key Architectural Principles Implemented

1. **Zero Dummy/Seed Data**: Starts completely empty. First run triggers the company profile & Admin creation screen or reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.
2. **Server-Side Data Scope & RBAC**: Every API validates both role AND entity ownership on the server. Employees can **never** query or modify another employee's records, salary, or attendance.
3. **Pure Database Aggregations**: All dashboard KPIs, attrition metrics, attendance rates, and averages are computed live via MongoDB aggregations and support department filtering.
4. **Append-Only Immutable Audit Trail**: All actions (`CREATE`, `UPDATE`, `APPROVE`, `FINALIZE`) are logged with actor, role, entity, IP address, and before/after JSON diffs. Modification or deletion of audit logs is strictly blocked at the schema level.
5. **Server Timestamps**: All check-in, check-out, and approval times are stamped by the server clock.

---

## 📋 Features Checklist (25 / 25 Complete + Bonus)

| # | Functionality | Admin | HR | Employee | Status |
|---|---|:---:|:---:|:---:|:---:|
| 01 | **First-run setup**: company profile and first Admin account | Manage | — | — | ✅ Complete |
| 02 | **Auth & RBAC**: login/logout, password change, forced initial reset, role menus | Own | Own | Own | ✅ Complete |
| 03 | **Company settings**: office hours, grace time, weekend, geofence radius | Manage | View | — | ✅ Complete |
| 04 | **Org setup**: departments, designations, leave quotas, public holidays | Manage | View | — | ✅ Complete |
| 05 | **User management**: create HR logins, deactivate/activate, reset passwords | Manage | — | — | ✅ Complete |
| 06 | **Register employee**: creates login with temporary password; self-edit contact | View | Manage | Own Contact | ✅ Complete |
| 07 | **Employee directory & 360 profile**: search, filters, attendance & payslips | All | All | Own 360 | ✅ Complete |
| 08 | **CSV Import & Export**: server dry-run reporting row+field+reason; CSV export | — | Manage | — | ✅ Complete |
| 09 | **Web Check-in & Check-out**: single daily record, late detection (09:15), half-day | — | Own | Own | ✅ Complete |
| 10 | **Attendance calendar & daily board**: company board, monthly calendar | All | All | Own | ✅ Complete |
| 11 | **Attendance corrections**: employee requests, HR reviews with comment | View | Approve | Request | ✅ Complete |
| 12 | **Leave management**: apply, cancel, working days count (skips weekends/holidays) | — | Own | Own | ✅ Complete |
| 13 | **Leave approval inbox**: HR approves/rejects with review comment | View | Approve | — | ✅ Complete |
| 14 | **Salary structure**: Basic, HRA (40%), Medical (10%), Allowances, Gross (1.5x) | View | Manage | — | ✅ Complete |
| 15 | **Monthly payroll draft**: attendance deductions, joiner proration, tax slabs | View | Manage | — | ✅ Complete |
| 16 | **Payroll finalization**: Admin locks month permanently; generates notifications | Manage | — | — | ✅ Complete |
| 17 | **Payslips**: confidential view and one-click PDF download | All | All | Own | ✅ Complete |
| 18 | **Dashboards & KPIs**: headcount, attrition YTD, payroll cost, attendance rate | Company | HR | Personal | ✅ Complete |
| 19 | **AI Assistant Chat**: tool calling on real data via server services | All data | HR data | Own data | ✅ Complete |
| 20 | **AI Dashboard Summary**: 3-5 insight bullets generated from live numbers | Yes | Yes | — | ✅ Complete |
| 21 | **Smart Leave (AI)**: natural language sentence to validated form pre-fill | — | Own | Own | ✅ Complete |
| 22 | **Policy Q&A**: answers office hours, grace, tax slabs, or politely refuses | Yes | Yes | Yes | ✅ Complete |
| 23 | **Announcements**: Admin & HR post broadcasts, all users read | Post | Post | Read | ✅ Complete |
| 24 | **In-app notifications**: leave decisions, finalized payslips, broadcasts | Own | Own | Own | ✅ Complete |
| 25 | **Append-only Audit Log**: inspect before/after JSON diffs | View | — | — | ✅ Complete |
| **+** | **Bonus: Camera check-in**: face detection frame + GPS accuracy & geofence | — | Own | Own | ✅ Complete |
| **+** | **Bonus: Late penalty rule**: 3 lates = 0.5 day deduction in payroll | Manage | Auto | Own | ✅ Complete |
| **+** | **Bonus: Roman Urdu AI**: understands *"Kitni sick leaves baqi hain?"* | All | All | All | ✅ Complete |
| **+** | **Bonus: Dark mode**: theme toggle with persistent storage | All | All | All | ✅ Complete |

---

## 🛠️ How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally (`mongodb://127.0.0.1:27017/hcm_lite`) or a free MongoDB Atlas URI

### 1. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `backend/.env` if desired (MongoDB URI, JWT secret, and optional Gemini `AI_API_KEY`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/hcm_lite
JWT_SECRET=super_secure_jwt_secret_key_change_in_production_2026
AI_API_KEY=your_gemini_api_key_here
AI_PROVIDER=gemini
CLIENT_URL=http://localhost:5173
```
Start the backend server:
```bash
npm run dev
# Or: node server.js
```

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: **`http://localhost:5173`**

---

## 👤 First-Run Setup (Judge Quickstart)

On fresh installation, navigating to `http://localhost:5173` automatically redirects to **`/setup`**:
1. Enter your **Company Name** (e.g. *Saylani Enterprises*).
2. Enter your desired **Admin Email** and **Password** (e.g. `admin@hcmlite.com` / `AdminPass123!`).
3. Set office hours (default: `09:00` - `18:00`), grace period (`15 min`), half-day (`5 hours`), and office location.
4. Click **Finish Setup & Launch HCM Lite**. You will be logged directly into the **Admin Portal**!

*(Alternatively, set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `COMPANY_NAME` in `backend/.env` for zero-click automatic provisioning).*

---

## 🔑 Quick Test Login Credentials

For quick testing & evaluation, click any demo account button on the login screen or use these credentials:

| Role | Email Address | Password | Key Privileges to Test |
|---|---|---|---|
| **Admin** | `admin@hcmlite.com` | `Admin123!` | Company settings, org setup, payroll finalization, append-only audit trail |
| **HR Officer** | `hr@hcmlite.com` | `Hr123456!` | Register employees, CSV import/export, attendance board, leave approvals, payroll draft |
| **Employee** | `ali@hcmlite.com` | `Ali123456!` | Web/Camera check-in, apply leave, smart leave AI, personal payslips (cannot see others' data) |

---

## 🤖 AI Assistant Capabilities & Guardrails

- **Endpoint**: `POST /api/ai/chat` (rate limited to 20 queries/user/hour).
- **Backend-Only Execution**: The browser never sees or calls the AI key directly. The LLM selects tools which the backend runs with the logged-in user's role and database scope.
- **Salary Confidentiality Enforcement**: If an employee asks:
  > *"What is my colleague's salary?"*  
  The AI immediately refuses:  
  > *"I cannot disclose colleague salary information as it is strictly confidential."*
- **Live Test Questions**:
  - **HR**: *"Who came late most often this month?"* → Exact list matching database board.
  - **Employee**: *"How many sick leaves do I have left this year?"* → Exact individual balance after approved leaves.
  - **Smart Leave**: *"Need next Monday and Tuesday off for sister's wedding"* → Extracts type, dates, and pre-fills confirmation form.
  - **Roman Urdu**: *"Mujhe kal chutti chahiye"* or *"Meri kitni casual leaves hain?"* → Accurately answered.

---

## 🌐 Free Hosting Deployment Notes

- **Frontend**: Deploy `frontend/` to **Vercel** or **Netlify**:
  - Build command: `npm run build`
  - Output directory: `dist`
  - Add rewrites/redirects for single-page app routing.
- **Backend**: Deploy `backend/` to **Render** or **Railway**:
  - Build command: `npm install`
  - Start command: `node server.js`
  - Environment variables: `MONGODB_URI`, `JWT_SECRET`, `AI_API_KEY`, `CLIENT_URL`.
- **Database**: MongoDB Atlas free M0 cluster (select AWS/GCP Frankfurt or Singapore, create database user, allow access from `0.0.0.0/0`).

---

## ⏱️ 5-Minute Judging Demo Script

1. **Fresh Start Setup (0:00 - 0:45)**:
   - Open app; system launches `/setup`.
   - Setup company: *Saylani Tech*, Admin: `admin@saylani.com`, password `Admin123!`.
   - Review Company Settings and Departments (*Engineering*, *HR*).
   - Go to **User Management** → Click **Provision HR Account** (`hr@saylani.com` / `HrPass123!`).
2. **HR Operations & Registration (0:45 - 2:00)**:
   - Sign in as `hr@saylani.com`.
   - Go to **Employee Directory** → Register employee *Ali Khan* (`ali@saylani.com`, basic salary PKR 80,000). System shows temporary password `Welcome@123`.
   - Show CSV Import dry-run preview with error detection.
3. **Employee Self-Service (2:00 - 3:15)**:
   - Sign in as `ali@saylani.com` with `Welcome@123`.
   - Prompt forces password update to `AliSecure2026!`.
   - Click **Web Check-In** (or Biometric Camera Check-in). Note server timestamp and status.
   - Click **Smart Leave** → Type *"Need next Monday and Tuesday off for family wedding"*. Confirm pre-filled form.
   - Open AI Assistant → Ask: *"What is my colleague's salary?"* → Note polite refusal.
4. **HR Approvals & Payroll Run (3:15 - 4:15)**:
   - Sign in as `hr@saylani.com` → Open **Leave Approvals** → Approve Ali's leave request with comment.
   - Go to **Payroll Management** → Click **Generate Monthly Draft** for current month.
   - Review working days, absent/leave deductions, income tax calculation, and net payout.
5. **Admin Finalization & Audit Trail (4:15 - 5:00)**:
   - Sign in as `admin@saylani.com`.
   - Open **Payroll Finalization** → Click **Admin: Finalize & Lock Month** (locks run permanently).
   - Click **Audit Trail** → Show immutable append-only logs with JSON before/after state diffs for every step.

---
*Built with ❤️ for Saylani Hackathon 2026*
