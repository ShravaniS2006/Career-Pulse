# CareerPulse - Full-Stack Job Portal

A modern, responsive, full-stack Job Portal built strictly with:
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js only (Express.js, Multer for file uploads)
- **Database**: Persistent JSON data storage with atomic file synchronization

---

## 🚀 Quick Start

### 1. Start the Server
Make sure Node.js is installed, then run in the project directory:

```bash
npm start
```
Or directly:
```bash
node server.js
```

### 2. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

---

## ⚡ 1-Click Demo Accounts

On the **[Login Page](http://localhost:3000/login.html)**, you can click any of the 1-click demo buttons:

| Role | Profile Name | Email | Password | Features |
|---|---|---|---|---|
| **Job Seeker** | **Arjun Patel** | `seeker@demo.com` | `seeker123` | Search jobs in ₹ / LPA, Apply, Upload Resume, Live Status Tracker |
| **Recruiter** | **Priya Sharma** (Nexus Tech India) | `recruiter@demo.com` | `recruiter123` | Post Jobs in ₹ / LPA, Manage Listings, View Applicants & Resumes, Update Status |
| **Admin / Owner** | **Rajesh Sharma** | `admin@jobportal.com` | `admin123` | 360° User Dossiers, Companies, All Jobs, View Applications, **Delete Fake Job Posts** |

*(You can also register brand new accounts as a Job Seeker or Recruiter from the Sign Up page).*

---

## 🎯 Features Implemented

### 1. Job Seeker
- **Register / Login**: Role-based registration with email, phone, headline, skills, bio.
- **Search Jobs**: Filter by keywords, category, job type (Full-time, Part-time, Remote, Contract), and location.
- **View Job Details**: Complete view with salary, responsibilities, requirements, benefits, and company profile.
- **Apply for Jobs**: Quick apply modal with cover note.
- **Upload Resume**: Direct upload of PDF, DOC, DOCX, TXT files via `multer` into `/uploads/resumes/`. Candidates can also maintain a default resume on their profile.
- **Check Application Status**: Real-time visual progress tracker:
  `Applied` ➔ `Under Review` ➔ `Shortlisted / Interviewing` ➔ `Hired` (or `Rejected`), with direct recruiter feedback and notes.

### 2. Recruiter / Company
- **Register / Login**: Employer registration with company name, website, industry, headquarters, and description.
- **Post New Jobs**: Comprehensive form including title, category, type, location, salary range, experience, description, responsibilities, requirements, and benefits.
- **Manage Jobs**: View all posted jobs, toggle status (Active / Closed), edit job details, or delete listings.
- **View Applicants**: Browse applicants per job or across all company postings. Includes applicant name, contact details, date applied, cover note, and downloadable resume link.
- **Update Application Status**: Set candidate status to `Applied`, `Under Review`, `Shortlisted`, `Interviewing`, `Hired`, or `Rejected`, with custom recruiter notes.

### 3. Admin
- **Manage Users**: View all registered Job Seekers and Recruiters, filter by role, toggle status (`Active` / `Suspended`), or delete accounts.
- **Manage Companies**: View all registered companies, job counts, inspect details, toggle Verified trust status, or delete companies.
- **Manage Jobs**: View, search, and manage all jobs published on the platform.
- **View Applications**: Global view of all job applications submitted across the entire system.
- **Delete Fake Job Posts (Core Highlight)**:
  - Dedicated **"Fake Job Posts Queue"** surfacing postings flagged for suspicious fee demands (e.g. upfront crypto/registration fees), unrealistic pay, or user reports.
  - One-click **"Delete Fake Job Post"** action that permanently purges the fraudulent listing and optionally suspends the offending recruiter account.
  - Option to dismiss flags if a post is confirmed legitimate.

---

## 📁 Project Architecture

```
project/
├── server.js                     # Node.js Express server & REST API
├── package.json                  # Dependencies (express, multer)
├── data/
│   ├── db.js                     # Data access layer & atomic JSON persistence
│   └── db.json                   # Database (users, companies, jobs, applications)
├── uploads/
│   └── resumes/                  # Uploaded candidate resumes (PDF, DOC, TXT)
└── public/                       # Frontend HTML, CSS & Vanilla JavaScript
    ├── index.html                # Landing page with hero search & featured jobs
    ├── jobs.html                 # Job browsing, live search, filters, quick apply
    ├── job-details.html          # Detailed job view & company profile
    ├── login.html                # Login with 1-click demo buttons
    ├── register.html             # Role-based signup (Seeker vs Recruiter)
    ├── seeker-dashboard.html     # Seeker portal (applications status, resume upload)
    ├── recruiter-dashboard.html  # Recruiter portal (post job, manage, view applicants)
    ├── admin-dashboard.html      # Admin portal (users, companies, fake job deleter)
    ├── css/
    │   ├── style.css             # Main styling, design system, modals, badges, toasts
    │   └── dashboard.css         # Dashboard layout, metric cards, status tracker
    └── js/
        ├── api.js                # API client with token auth & toast notifications
        ├── auth.js               # Route protection & dynamic navbar
        ├── main.js               # Homepage featured jobs & metrics
        ├── jobs.js               # Job search, filters, quick apply modal
        ├── job-details.js        # Job detail view & report scam modal
        ├── seeker.js             # Seeker applications status & profile logic
        ├── recruiter.js          # Recruiter jobs, applicants & status management
        └── admin.js              # Admin moderation & Delete Fake Job Posts logic
```
