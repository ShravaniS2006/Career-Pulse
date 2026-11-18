const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./data/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage for Resumes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `resume-${Date.now()}-${cleanName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowedExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, TXT, or RTF files are supported.'));
    }
  }
});

// Serve static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Simple Auth Token Store (In-Memory Session Mapping)
const sessions = new Map();

function generateToken(userId) {
  const token = 'tok_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  sessions.set(token, userId);
  return token;
}

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token || !sessions.has(token)) {
    req.user = null;
    return next();
  }

  const userId = sessions.get(token);
  const user = db.getUserById(userId);
  if (!user || user.status === 'suspended') {
    sessions.delete(token);
    req.user = null;
    return next();
  }

  req.user = user;
  req.token = token;
  next();
}

app.use(authMiddleware);

// Role Enforcers
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied. Requires role: ${roles.join(' or ')}.` });
    }
    next();
  };
}

// ==========================================
// 1. AUTH ROUTES
// ==========================================

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role, phone, skills, title, bio, companyName, companyWebsite, companyIndustry, companyLocation, companyDescription } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    if (!['seeker', 'recruiter'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either "seeker" or "recruiter".' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    let companyId = null;
    if (role === 'recruiter') {
      if (!companyName) {
        return res.status(400).json({ success: false, message: 'Company name is required for recruiters.' });
      }
      const company = db.createCompany({
        name: companyName,
        website: companyWebsite || '',
        industry: companyIndustry || 'Technology',
        location: companyLocation || 'Remote',
        description: companyDescription || '',
        verified: false
      });
      companyId = company.id;
    }

    const newUser = db.createUser({
      name,
      email: email.trim().toLowerCase(),
      password, // In real production we use bcrypt; simple plain text for demo & transparency
      role,
      phone: phone || '',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : []),
      title: title || (role === 'seeker' ? 'Job Seeker' : 'Hiring Manager'),
      bio: bio || '',
      companyId: companyId,
      companyName: companyName || '',
      resumeUrl: '',
      resumeName: ''
    });

    if (companyId) {
      db.updateCompany(companyId, { recruiterId: newUser.id });
    }

    const token = generateToken(newUser.id);
    const { password: _, ...userSafe } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = db.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by the administrator.' });
    }

    const token = generateToken(user.id);
    const { password: _, ...userSafe } = user;

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', requireAuth, (req, res) => {
  const { password: _, ...userSafe } = req.user;
  let company = null;
  if (req.user.companyId) {
    company = db.getCompanyById(req.user.companyId);
  }
  res.json({ success: true, user: userSafe, company });
});

// Update Profile
app.put('/api/auth/profile', requireAuth, (req, res) => {
  try {
    const { name, phone, title, bio, skills } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (title !== undefined) updates.title = title;
    if (bio !== undefined) updates.bio = bio;
    if (skills !== undefined) {
      updates.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updated = db.updateUser(req.user.id, updates);
    const { password: _, ...userSafe } = updated;
    res.json({ success: true, message: 'Profile updated successfully!', user: userSafe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload Resume for Seeker Profile
app.post('/api/auth/upload-resume', requireAuth, upload.single('resume'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a resume file to upload.' });
    }

    const fileUrl = `/uploads/resumes/${req.file.filename}`;
    const updated = db.updateUser(req.user.id, {
      resumeUrl: fileUrl,
      resumeName: req.file.originalname
    });

    res.json({
      success: true,
      message: 'Resume uploaded successfully!',
      resumeUrl: fileUrl,
      resumeName: req.file.originalname
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 2. JOBS ROUTES
// ==========================================

// Get All Jobs (Public & Seekers)
app.get('/api/jobs', (req, res) => {
  try {
    const { q, category, type, location, minSalary, maxSalary, featured } = req.query;
    let jobs = db.getJobs(false); // Only non-fake, active jobs

    // Filter by query (title, company, description, requirements)
    if (q) {
      const query = q.toLowerCase();
      jobs = jobs.filter(j =>
        (j.title && j.title.toLowerCase().includes(query)) ||
        (j.companyName && j.companyName.toLowerCase().includes(query)) ||
        (j.description && j.description.toLowerCase().includes(query)) ||
        (j.category && j.category.toLowerCase().includes(query)) ||
        (j.requirements && j.requirements.some(r => r.toLowerCase().includes(query)))
      );
    }

    // Filter by category
    if (category && category !== 'All') {
      jobs = jobs.filter(j => j.category && j.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by Job Type
    if (type && type !== 'All') {
      jobs = jobs.filter(j => j.type && j.type.toLowerCase() === type.toLowerCase());
    }

    // Filter by Location
    if (location) {
      const loc = location.toLowerCase();
      jobs = jobs.filter(j => j.location && j.location.toLowerCase().includes(loc));
    }

    // Filter by featured
    if (featured === 'true') {
      jobs = jobs.filter(j => j.isFeatured);
    }

    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Single Job Details
app.get('/api/jobs/:id', (req, res) => {
  try {
    const job = db.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const company = job.companyId ? db.getCompanyById(job.companyId) : null;
    res.json({ success: true, job, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Post New Job (Recruiter Only)
app.post('/api/jobs', requireRole('recruiter'), (req, res) => {
  try {
    const {
      title,
      category,
      type,
      location,
      salary,
      experience,
      description,
      responsibilities,
      requirements,
      benefits
    } = req.body;

    if (!title || !category || !type || !description) {
      return res.status(400).json({ success: false, message: 'Job title, category, type, and description are required.' });
    }

    const recruiter = req.user;
    const company = recruiter.companyId ? db.getCompanyById(recruiter.companyId) : null;

    const parseList = (item) => {
      if (Array.isArray(item)) return item.filter(Boolean);
      if (typeof item === 'string') return item.split('\n').map(s => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
      return [];
    };

    const newJob = db.createJob({
      title,
      category,
      type,
      location: location || 'Remote',
      salary: salary || 'Negotiable',
      experience: experience || 'Entry / Mid',
      description,
      responsibilities: parseList(responsibilities),
      requirements: parseList(requirements),
      benefits: parseList(benefits),
      recruiterId: recruiter.id,
      companyId: recruiter.companyId || '',
      companyName: company ? company.name : (recruiter.companyName || 'Confidential')
    });

    res.status(201).json({ success: true, message: 'Job posted successfully!', job: newJob });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Job (Recruiter who owns the job, or Admin)
app.put('/api/jobs/:id', requireAuth, (req, res) => {
  try {
    const job = db.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (req.user.role !== 'admin' && job.recruiterId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own jobs.' });
    }

    const {
      title, category, type, location, salary, experience,
      description, responsibilities, requirements, benefits, status
    } = req.body;

    const parseList = (item) => {
      if (!item) return undefined;
      if (Array.isArray(item)) return item.filter(Boolean);
      if (typeof item === 'string') return item.split('\n').map(s => s.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
      return [];
    };

    const updates = {};
    if (title) updates.title = title;
    if (category) updates.category = category;
    if (type) updates.type = type;
    if (location) updates.location = location;
    if (salary) updates.salary = salary;
    if (experience) updates.experience = experience;
    if (description) updates.description = description;
    if (status) updates.status = status;
    if (responsibilities !== undefined) updates.responsibilities = parseList(responsibilities);
    if (requirements !== undefined) updates.requirements = parseList(requirements);
    if (benefits !== undefined) updates.benefits = parseList(benefits);

    const updatedJob = db.updateJob(req.params.id, updates);
    res.json({ success: true, message: 'Job updated successfully!', job: updatedJob });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Job (Recruiter owner or Admin)
app.delete('/api/jobs/:id', requireAuth, (req, res) => {
  try {
    const job = db.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (req.user.role !== 'admin' && job.recruiterId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this job.' });
    }

    db.deleteJob(req.params.id);
    res.json({ success: true, message: 'Job deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Report / Flag Job as Fake (Job Seekers / Public)
app.post('/api/jobs/:id/report', (req, res) => {
  try {
    const { reason, reporterEmail } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for reporting this job.' });
    }

    const email = req.user ? req.user.email : (reporterEmail || 'Anonymous User');
    const job = db.reportFakeJob(req.params.id, reason, email);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    res.json({
      success: true,
      message: 'Job reported to administrators for review. Thank you for keeping our community safe!',
      flagCount: job.flagCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 3. APPLICATIONS ROUTES
// ==========================================

// Apply for Job (Job Seeker with Resume Upload)
app.post('/api/applications', requireRole('seeker'), upload.single('resume'), (req, res) => {
  try {
    const { jobId, coverNote } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Job ID is required.' });
    }

    const job = db.getJobById(jobId);
    if (!job || job.isFake || job.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This job is no longer accepting applications.' });
    }

    let resumeUrl = req.user.resumeUrl || '';
    let resumeName = req.user.resumeName || '';

    // If new resume uploaded in this application form
    if (req.file) {
      resumeUrl = `/uploads/resumes/${req.file.filename}`;
      resumeName = req.file.originalname;

      // Also update seeker profile's default resume if they didn't have one
      if (!req.user.resumeUrl) {
        db.updateUser(req.user.id, { resumeUrl, resumeName });
      }
    }

    if (!resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'A resume is required. Please upload your resume to complete this application.'
      });
    }

    const application = db.createApplication({
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.companyName,
      recruiterId: job.recruiterId,
      seekerId: req.user.id,
      applicantName: req.user.name,
      applicantEmail: req.user.email,
      applicantPhone: req.user.phone || '',
      resumeUrl: resumeUrl,
      resumeName: resumeName,
      coverNote: coverNote || ''
    });

    res.status(201).json({
      success: true,
      message: 'Your application has been submitted successfully!',
      application
    });
  } catch (err) {
    console.error('Application error:', err);
    res.status(400).json({ success: false, message: err.message || 'Failed to submit application.' });
  }
});

// Check Application Status (Seeker: View My Applications)
app.get('/api/applications/my', requireRole('seeker'), (req, res) => {
  try {
    const applications = db.getApplicationsBySeeker(req.user.id);
    res.json({ success: true, count: applications.length, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// View Applicants for a specific job (Recruiter)
app.get('/api/applications/job/:jobId', requireRole('recruiter', 'admin'), (req, res) => {
  try {
    const job = db.getJobById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (req.user.role !== 'admin' && job.recruiterId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view applicants for your own jobs.' });
    }

    const applications = db.getApplicationsByJob(req.params.jobId);
    res.json({ success: true, count: applications.length, job, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// View all applicants for logged-in recruiter across all jobs
app.get('/api/applications/recruiter', requireRole('recruiter'), (req, res) => {
  try {
    const applications = db.getApplicationsByRecruiter(req.user.id);
    res.json({ success: true, count: applications.length, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Application Status (Recruiter / Company & Admin)
app.put('/api/applications/:id/status', requireRole('recruiter', 'admin'), (req, res) => {
  try {
    const { status, recruiterNotes } = req.body;
    const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interviewing', 'Hired', 'Rejected'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const application = db.getApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (req.user.role !== 'admin' && application.recruiterId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only manage applications for your own jobs.' });
    }

    const updated = db.updateApplicationStatus(req.params.id, status, recruiterNotes);
    res.json({
      success: true,
      message: `Candidate status updated to "${status}".`,
      application: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Withdraw application (Job Seeker)
app.delete('/api/applications/:id', requireRole('seeker', 'admin'), (req, res) => {
  try {
    const application = db.getApplicationById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (req.user.role !== 'admin' && application.seekerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only withdraw your own applications.' });
    }

    db.deleteApplication(req.params.id);
    res.json({ success: true, message: 'Application withdrawn successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 4. RECRUITER & COMPANY SPECIFIC ROUTES
// ==========================================

// Get recruiter's posted jobs with application counts
app.get('/api/recruiter/jobs', requireRole('recruiter'), (req, res) => {
  try {
    const allJobs = db.getAllJobsAdmin().filter(j => j.recruiterId === req.user.id);
    const allApps = db.getApplicationsByRecruiter(req.user.id);

    const jobsWithCounts = allJobs.map(job => {
      const jobApps = allApps.filter(a => a.jobId === job.id);
      return {
        ...job,
        applicantCount: jobApps.length,
        shortlistedCount: jobApps.filter(a => a.status === 'Shortlisted' || a.status === 'Interviewing').length
      };
    });

    res.json({ success: true, count: jobsWithCounts.length, jobs: jobsWithCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Recruiter Company Details
app.get('/api/recruiter/company', requireRole('recruiter'), (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(404).json({ success: false, message: 'No company attached to this recruiter account.' });
    }
    const company = db.getCompanyById(req.user.companyId);
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Company Profile
app.put('/api/recruiter/company', requireRole('recruiter'), (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(404).json({ success: false, message: 'No company attached to this account.' });
    }

    const { name, website, industry, size, location, description } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (website !== undefined) updates.website = website;
    if (industry !== undefined) updates.industry = industry;
    if (size !== undefined) updates.size = size;
    if (location !== undefined) updates.location = location;
    if (description !== undefined) updates.description = description;

    const company = db.updateCompany(req.user.companyId, updates);
    res.json({ success: true, message: 'Company details updated!', company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// 5. ADMIN ROUTES
// ==========================================

// Admin System Stats
app.get('/api/admin/stats', requireRole('admin'), (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Manage Users (View all with rich owner-level information)
app.get('/api/admin/users', requireRole('admin'), (req, res) => {
  try {
    const { role } = req.query;
    let users = db.getUsers();
    if (role && role !== 'all') {
      users = users.filter(u => u.role === role);
    }

    const allApps = db.getApplications();
    const allJobs = db.getAllJobsAdmin();
    const allCompanies = db.getCompanies();

    const richUsers = users.map(({ password, ...u }) => {
      if (u.role === 'seeker') {
        const seekerApps = allApps.filter(a => a.seekerId === u.id);
        return {
          ...u,
          applicationsCount: seekerApps.length,
          recentApplications: seekerApps.map(a => ({
            id: a.id,
            jobTitle: a.jobTitle,
            companyName: a.companyName,
            status: a.status,
            appliedAt: a.appliedAt,
            resumeUrl: a.resumeUrl
          }))
        };
      } else if (u.role === 'recruiter') {
        const company = u.companyId ? allCompanies.find(c => c.id === u.companyId) : null;
        const recruiterJobs = allJobs.filter(j => j.recruiterId === u.id);
        const recruiterJobIds = recruiterJobs.map(j => j.id);
        const recruiterApps = allApps.filter(a => recruiterJobIds.includes(a.jobId) || a.recruiterId === u.id);

        return {
          ...u,
          company: company || null,
          companyName: company ? company.name : (u.companyName || 'Not Set'),
          jobsCount: recruiterJobs.length,
          totalApplicantsReceived: recruiterApps.length,
          postedJobs: recruiterJobs.map(j => ({
            id: j.id,
            title: j.title,
            salary: j.salary,
            status: j.status,
            category: j.category,
            location: j.location,
            applicantCount: allApps.filter(a => a.jobId === j.id).length
          }))
        };
      }
      return u;
    });

    res.json({ success: true, count: richUsers.length, users: richUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get Single User Full 360-Degree Profile Details
app.get('/api/admin/users/:id/details', requireRole('admin'), (req, res) => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { password, ...safeUser } = user;
    const allApps = db.getApplications();
    const allJobs = db.getAllJobsAdmin();
    const allCompanies = db.getCompanies();

    let details = { user: safeUser };

    if (user.role === 'seeker') {
      const seekerApps = allApps.filter(a => a.seekerId === user.id);
      details.applications = seekerApps;
      details.totalApplications = seekerApps.length;
    } else if (user.role === 'recruiter') {
      const company = user.companyId ? allCompanies.find(c => c.id === user.companyId) : null;
      const recruiterJobs = allJobs.filter(j => j.recruiterId === user.id);
      const recruiterJobIds = recruiterJobs.map(j => j.id);
      const recruiterApps = allApps.filter(a => recruiterJobIds.includes(a.jobId) || a.recruiterId === user.id);

      details.company = company || null;
      details.jobs = recruiterJobs.map(j => ({
        ...j,
        applicantCount: allApps.filter(a => a.jobId === j.id).length
      }));
      details.totalJobs = recruiterJobs.length;
      details.totalApplicantsReceived = recruiterApps.length;
      details.recentApplicants = recruiterApps.slice(0, 10);
    }

    res.json({ success: true, ...details });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Toggle User Status (Active / Suspended)
app.put('/api/admin/users/:id/status', requireRole('admin'), (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or suspended.' });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own admin account.' });
    }

    const updated = db.updateUser(req.params.id, { status });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, message: `User marked as ${status}.`, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete User
app.delete('/api/admin/users/:id', requireRole('admin'), (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself.' });
    }
    const deleted = db.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, message: 'User and all associated data deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Manage Companies (View list)
app.get('/api/admin/companies', requireRole('admin'), (req, res) => {
  try {
    const companies = db.getCompanies();
    const jobs = db.getAllJobsAdmin();

    const companiesWithMeta = companies.map(comp => {
      const compJobs = jobs.filter(j => j.companyId === comp.id);
      return {
        ...comp,
        jobCount: compJobs.length,
        hasFakeJobs: compJobs.some(j => j.isFake || j.status === 'flagged')
      };
    });

    res.json({ success: true, count: companiesWithMeta.length, companies: companiesWithMeta });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Toggle Company Verification
app.put('/api/admin/companies/:id/verify', requireRole('admin'), (req, res) => {
  try {
    const { verified } = req.body;
    const updated = db.updateCompany(req.params.id, { verified: !!verified });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }
    res.json({
      success: true,
      message: `Company marked as ${verified ? 'Verified' : 'Unverified'}.`,
      company: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete Company
app.delete('/api/admin/companies/:id', requireRole('admin'), (req, res) => {
  try {
    const deleted = db.deleteCompany(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }
    res.json({ success: true, message: 'Company and its job posts deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Manage All Jobs
app.get('/api/admin/jobs', requireRole('admin'), (req, res) => {
  try {
    const jobs = db.getAllJobsAdmin();
    const apps = db.getApplications();

    const jobsWithCounts = jobs.map(j => ({
      ...j,
      applicantCount: apps.filter(a => a.jobId === j.id).length
    }));

    res.json({ success: true, count: jobsWithCounts.length, jobs: jobsWithCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Dedicated Get Fake / Flagged Jobs
app.get('/api/admin/fake-jobs', requireRole('admin'), (req, res) => {
  try {
    const allJobs = db.getAllJobsAdmin();
    const fakeJobs = allJobs.filter(j => j.isFake || j.status === 'flagged' || (j.flagCount && j.flagCount > 0));
    res.json({ success: true, count: fakeJobs.length, jobs: fakeJobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: DELETE FAKE JOB POST (Special Highlighted Admin Feature)
app.delete('/api/admin/jobs/:id/fake', requireRole('admin'), (req, res) => {
  try {
    const { banRecruiter } = req.body;
    const job = db.getJobById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const jobTitle = job.title;
    const recruiterId = job.recruiterId;

    // Delete the fake job and associated applications
    db.deleteJob(req.params.id);

    // Optionally suspend the fake/fraudulent recruiter account
    let recruiterBanned = false;
    if (banRecruiter && recruiterId) {
      db.updateUser(recruiterId, { status: 'suspended' });
      recruiterBanned = true;
    }

    res.json({
      success: true,
      message: `Fake job post "${jobTitle}" has been permanently deleted from the platform.` +
        (recruiterBanned ? ' The associated fraudulent recruiter account has been suspended.' : '')
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Dismiss Flag on Job (Mark as legitimate)
app.put('/api/admin/jobs/:id/dismiss-flag', requireRole('admin'), (req, res) => {
  try {
    const updated = db.updateJob(req.params.id, {
      status: 'active',
      isFake: false,
      flagCount: 0,
      flagReasons: []
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    res.json({ success: true, message: 'Flags dismissed. Job restored as active and verified.', job: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: View All Applications across the platform
app.get('/api/admin/applications', requireRole('admin'), (req, res) => {
  try {
    const applications = db.getApplications();
    res.json({ success: true, count: applications.length, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Job Portal Server running on http://localhost:${PORT}`);
  console.log(`📁 Static files hosted from /public`);
  console.log(`📄 Uploaded resumes stored in /uploads/resumes`);
  console.log(`====================================================`);
});
