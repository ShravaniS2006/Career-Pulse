const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

const INITIAL_DATA = {
  users: [
    {
      id: 'usr-admin-1',
      name: 'Rajesh Sharma',
      email: 'admin@jobportal.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      phone: '+91 98110 12345',
      title: 'Platform Administrator & Website Owner',
      createdAt: '2026-01-10T10:00:00.000Z'
    },
    {
      id: 'usr-rec-1',
      name: 'Priya Sharma',
      email: 'recruiter@demo.com',
      password: 'recruiter123',
      role: 'recruiter',
      status: 'active',
      phone: '+91 98201 44556',
      companyId: 'comp-1',
      companyName: 'Nexus Tech India',
      createdAt: '2026-02-01T09:30:00.000Z'
    },
    {
      id: 'usr-rec-2',
      name: 'Vikram Malhotra',
      email: 'apex@demo.com',
      password: 'recruiter123',
      role: 'recruiter',
      status: 'active',
      phone: '+91 98450 78912',
      companyId: 'comp-2',
      companyName: 'Zenith Cloud Technologies',
      createdAt: '2026-02-15T11:15:00.000Z'
    },
    {
      id: 'usr-rec-3',
      name: 'Rohan Verma (Suspicious)',
      email: 'fake_poster@scammail.com',
      password: 'scam123',
      role: 'recruiter',
      status: 'suspended',
      phone: '+91 90000 99999',
      companyId: 'comp-3',
      companyName: 'Quick Cash India Solutions',
      createdAt: '2026-10-01T14:00:00.000Z'
    },
    {
      id: 'usr-seek-1',
      name: 'Arjun Patel',
      email: 'seeker@demo.com',
      password: 'seeker123',
      role: 'seeker',
      status: 'active',
      phone: '+91 98765 43210',
      title: 'Full Stack Web Developer',
      skills: ['React', 'Node.js', 'JavaScript', 'HTML/CSS', 'PostgreSQL', 'Git'],
      bio: 'Experienced full stack developer looking for high-impact software engineering roles in Bengaluru, Pune, or remote India.',
      resumeUrl: '/uploads/resumes/sample-arjun-patel-resume.txt',
      resumeName: 'sample-arjun-patel-resume.txt',
      createdAt: '2026-02-10T08:00:00.000Z'
    },
    {
      id: 'usr-seek-2',
      name: 'Ananya Iyer',
      email: 'ananya@demo.com',
      password: 'seeker123',
      role: 'seeker',
      status: 'active',
      phone: '+91 97654 32109',
      title: 'Senior Product Designer (UI/UX)',
      skills: ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping', 'User Research'],
      bio: 'Creative product designer focused on intuitive UX and sleek design systems for fintech and enterprise SaaS applications.',
      resumeUrl: '/uploads/resumes/sample-ananya-iyer-resume.txt',
      resumeName: 'sample-ananya-iyer-resume.txt',
      createdAt: '2026-02-20T12:00:00.000Z'
    },
    {
      id: 'usr-seek-3',
      name: 'Rohan Kulkarni',
      email: 'rohan@demo.com',
      password: 'seeker123',
      role: 'seeker',
      status: 'active',
      phone: '+91 99887 76655',
      title: 'Data Analyst & BI Specialist',
      skills: ['Python', 'SQL', 'Tableau', 'PowerBI', 'Data Modeling', 'Statistics'],
      bio: 'Data professional extracting actionable business insights from complex Indian e-commerce and banking datasets.',
      resumeUrl: '',
      resumeName: '',
      createdAt: '2026-03-01T15:30:00.000Z'
    }
  ],
  companies: [
    {
      id: 'comp-1',
      name: 'Nexus Tech India',
      website: 'https://nexustech.in',
      industry: 'Software & Technology Services',
      size: '500-1000 employees',
      location: 'Bengaluru, Karnataka (Whitefield)',
      description: 'Nexus Tech India delivers enterprise-grade cloud collaboration software trusted by leading global enterprises and Indian unicorns.',
      verified: true,
      recruiterId: 'usr-rec-1',
      createdAt: '2026-02-01T09:30:00.000Z'
    },
    {
      id: 'comp-2',
      name: 'Zenith Cloud Technologies',
      website: 'https://zenithcloud.in',
      industry: 'Cloud Infrastructure & DevOps',
      size: '100-250 employees',
      location: 'Hyderabad, Telangana (HITEC City)',
      description: 'Zenith Cloud Technologies provides Kubernetes automation and high-availability cloud migration pipelines across India.',
      verified: true,
      recruiterId: 'usr-rec-2',
      createdAt: '2026-02-15T11:15:00.000Z'
    },
    {
      id: 'comp-3',
      name: 'Quick Cash India Solutions',
      website: 'http://quickcashindia.online',
      industry: 'Financial Services',
      size: '1-10 employees',
      location: 'Unverified / Noida, UP',
      description: 'Work from home and earn guaranteed daily thousands typing captchas with no skills or resume required.',
      verified: false,
      isSuspicious: true,
      recruiterId: 'usr-rec-3',
      createdAt: '2026-10-01T14:00:00.000Z'
    }
  ],
  jobs: [
    {
      id: 'job-1',
      title: 'Senior Full Stack Engineer',
      companyId: 'comp-1',
      companyName: 'Nexus Tech India',
      recruiterId: 'usr-rec-1',
      location: 'Bengaluru, KA (Hybrid)',
      type: 'Full-time',
      category: 'Engineering',
      salary: '₹18,00,000 - ₹24,00,000 / yr (18 - 24 LPA)',
      experience: '4+ Years',
      description: 'We are seeking an experienced Full Stack Engineer to lead the architecture and development of our real-time collaboration suite in Bengaluru. You will work across modern React frontends and Node.js microservices.',
      responsibilities: [
        'Design and implement high-performance, fault-tolerant REST and WebSocket APIs.',
        'Build responsive, intuitive client-side features in modern JavaScript/React.',
        'Collaborate with product managers and designers to deliver customer-facing roadmap items.',
        'Write clean, maintainable, and well-tested code with CI/CD integration.'
      ],
      requirements: [
        '4+ years of professional full-stack development experience.',
        'Strong expertise in Node.js, Express, JavaScript (ES6+), and modern frontend frameworks.',
        'Experience with relational databases (PostgreSQL/MySQL) and caching (Redis).',
        'Familiarity with cloud platforms (AWS/GCP) and containerization (Docker).'
      ],
      benefits: [
        'Competitive salary package: ₹18 - 24 LPA + ESOPs',
        'Comprehensive health insurance with parent coverage (₹10,00,000)',
        'Flexible hybrid work policy & home office setup allowance (₹30,000)',
        'Annual learning & certifications allowance (₹1,00,000)'
      ],
      status: 'active',
      isFeatured: true,
      isFake: false,
      flagCount: 0,
      flagReasons: [],
      createdAt: '2026-11-01T10:00:00.000Z'
    },
    {
      id: 'job-2',
      title: 'Lead UI/UX Product Designer',
      companyId: 'comp-1',
      companyName: 'Nexus Tech India',
      recruiterId: 'usr-rec-1',
      location: 'Remote (India)',
      type: 'Full-time',
      category: 'Design',
      salary: '₹14,00,000 - ₹18,00,000 / yr (14 - 18 LPA)',
      experience: '3+ Years',
      description: 'Join our design team to craft delightful and accessible user interfaces. You will translate user research and business needs into beautiful wireframes, user flows, and production-ready design systems.',
      responsibilities: [
        'Lead end-to-end design lifecycle for new SaaS dashboard features.',
        'Maintain and expand our unified Figma design token library.',
        'Conduct usability tests, interviews, and synthesize qualitative feedback.',
        'Partner with frontend developers to ensure pixel-perfect fidelity.'
      ],
      requirements: [
        '3+ years of experience designing web and mobile SaaS applications.',
        'Proficiency in Figma, prototyping tools, and user testing methodologies.',
        'Demonstrated portfolio showcasing end-to-end UX/UI projects.',
        'Understanding of modern HTML, CSS, and accessibility (WCAG) guidelines.'
      ],
      benefits: [
        '100% remote work flexibility across India',
        'Competitive compensation: ₹14 - 18 LPA',
        'Annual wellness & design tooling allowance (₹50,000)',
        'Unlimited paid time off (PTO) and health insurance'
      ],
      status: 'active',
      isFeatured: true,
      isFake: false,
      flagCount: 0,
      flagReasons: [],
      createdAt: '2026-11-03T11:30:00.000Z'
    },
    {
      id: 'job-3',
      title: 'DevOps & Cloud Infrastructure Engineer',
      companyId: 'comp-2',
      companyName: 'Zenith Cloud Technologies',
      recruiterId: 'usr-rec-2',
      location: 'Hyderabad, TS (Hybrid)',
      type: 'Full-time',
      category: 'DevOps',
      salary: '₹16,00,000 - ₹22,00,000 / yr (16 - 22 LPA)',
      experience: '3+ Years',
      description: 'Zenith Cloud is hiring a DevOps engineer to scale our multi-region Kubernetes clusters and streamline deployment pipelines for automated cloud infrastructure.',
      responsibilities: [
        'Maintain and improve Kubernetes clusters and Terraform infrastructure as code.',
        'Automate CI/CD pipelines using GitHub Actions and ArgoCD.',
        'Monitor system reliability, metrics, and incident response.',
        'Implement security best practices and compliance policies.'
      ],
      requirements: [
        '3+ years in DevOps, SRE, or Cloud Infrastructure roles.',
        'Strong knowledge of Kubernetes, Docker, Terraform, and AWS/Azure.',
        'Proficiency in scripting with Bash, Python, or Go.',
        'Familiarity with Prometheus, Grafana, and ELK stack.'
      ],
      benefits: [
        'Attractive package: ₹16 - 22 LPA + performance bonus',
        'Comprehensive family health & accident insurance',
        'Relocation assistance to Hyderabad / HITEC City',
        'Gym membership, meals, and transport reimbursement'
      ],
      status: 'active',
      isFeatured: false,
      isFake: false,
      flagCount: 0,
      flagReasons: [],
      createdAt: '2026-11-05T09:00:00.000Z'
    },
    {
      id: 'job-4',
      title: 'Frontend Developer (JavaScript / CSS)',
      companyId: 'comp-2',
      companyName: 'Zenith Cloud Technologies',
      recruiterId: 'usr-rec-2',
      location: 'Remote (India)',
      type: 'Contract',
      salary: '₹8,00,000 - ₹12,00,000 / yr (8 - 12 LPA)',
      experience: '2+ Years',
      description: 'We need a skilled Frontend Developer for a 6-month contract with possibility of full-time conversion. You will build user-friendly telemetry dashboards.',
      responsibilities: [
        'Develop responsive web interfaces using modern vanilla JavaScript, HTML5, and CSS3.',
        'Integrate REST APIs and render real-time telemetry charts.',
        'Optimize page performance, bundle sizes, and cross-browser rendering.'
      ],
      requirements: [
        'Solid foundation in modern JavaScript (ES6+), semantic HTML5, and CSS Grid/Flexbox.',
        'Experience consuming asynchronous REST APIs and handling WebSocket streams.',
        'Familiarity with version control (Git) and collaborative code reviews.'
      ],
      benefits: [
        'Flexible working hours and 100% remote within India',
        'Weekly payouts at ₹8 - 12 LPA equivalent rate',
        'High likelihood of full-time conversion'
      ],
      status: 'active',
      isFeatured: false,
      isFake: false,
      flagCount: 0,
      flagReasons: [],
      createdAt: '2026-11-07T14:15:00.000Z'
    },
    {
      id: 'job-5',
      title: 'Data Analyst & Business Intelligence',
      companyId: 'comp-2',
      companyName: 'Zenith Cloud Technologies',
      recruiterId: 'usr-rec-2',
      location: 'Pune, MH (Hybrid)',
      type: 'Full-time',
      category: 'Data & Analytics',
      salary: '₹9,00,000 - ₹13,00,000 / yr (9 - 13 LPA)',
      experience: '2+ Years',
      description: 'Analyze platform usage metrics, user funnel conversions, and revenue forecasts to drive strategic company decisions.',
      responsibilities: [
        'Write complex SQL queries to extract, transform, and aggregate business metrics.',
        'Build and maintain executive BI dashboards in Tableau and PowerBI.',
        'Present findings to leadership and support data-driven decisions.'
      ],
      requirements: [
        '2+ years in Data Analysis, BI, or Business Analytics.',
        'Expert SQL skills and experience with relational/columnar databases.',
        'Hands-on experience with Python or R for data cleaning and statistics.'
      ],
      benefits: [
        'Annual compensation: ₹9 - 13 LPA',
        'Hybrid working arrangements in Pune (Magarpatta)',
        'Generous paid annual leave, PF, and Gratuity'
      ],
      status: 'active',
      isFeatured: false,
      isFake: false,
      flagCount: 0,
      flagReasons: [],
      createdAt: '2026-11-09T08:45:00.000Z'
    },
    {
      id: 'job-6',
      title: 'Digital Marketing & Growth Specialist',
      companyId: 'comp-1',
      companyName: 'Nexus Tech India',
      recruiterId: 'usr-rec-1',
      location: 'Mumbai, MH (BKC)',
      type: 'Full-time',
      category: 'Marketing',
      salary: '₹10,00,000 - ₹14,00,000 / yr (10 - 14 LPA)',
      experience: '3+ Years',
      description: 'Drive customer acquisition and organic growth for our enterprise SaaS products through SEO, content marketing, and targeted paid campaigns.',
      responsibilities: [
        'Develop and execute multichannel B2B marketing strategies.',
        'Manage Google Ads, LinkedIn Ads, and organic content pipelines.',
        'Analyze campaign ROI and optimize conversion rates across landing pages.'
      ],
      requirements: [
        '3+ years in digital marketing, preferably within SaaS or technology.',
        'Deep knowledge of SEO best practices, SEM, and marketing analytics.',
        'Strong copywriting, storytelling, and communication skills.'
      ],
      benefits: [
        'Competitive salary: ₹10 - 14 LPA + incentives',
        'Generous digital marketing experiment budget',
        'Medical insurance & Mumbai commute allowance'
      ],
      status: 'active',
      isFeatured: false,
      isFake: false,
      flagCount: 0,
      flagReasons: [],
      createdAt: '2026-11-10T13:20:00.000Z'
    },
    {
      id: 'job-7',
      title: '⚠️ Data Entry Specialist - ₹25,000/Day Guaranteed Cash (No Skills Needed!)',
      companyId: 'comp-3',
      companyName: 'Quick Cash India Solutions',
      recruiterId: 'usr-rec-3',
      location: 'Remote / Anywhere in India',
      type: 'Part-time',
      category: 'Data Entry',
      salary: '₹25,000 / day',
      experience: 'None Required',
      description: 'EARN ₹25,000 PER DAY FROM HOME! Immediate opening. No experience or resume needed! Type simple captcha codes and copy paste text. Must send ₹2,499 registration fee via UPI / GPay / PhonePe for training kit and verification ID before starting work. Contact WhatsApp: +91 90000 99999 immediately!',
      responsibilities: [
        'Type text from images into excel sheets.',
        'Work only 2 hours a day and receive instant daily UPI bank transfers.'
      ],
      requirements: [
        'Must pay ₹2,499 refundable security deposit via UPI before onboarding.',
        'Must have internet and WhatsApp account.'
      ],
      benefits: [
        'Instant daily cash payouts',
        'No interview required'
      ],
      status: 'flagged',
      isFeatured: false,
      isFake: true,
      flagCount: 5,
      flagReasons: [
        'Fraudulent job offer: Demands ₹2,499 registration fee upfront via UPI / PhonePe',
        'Unrealistic pay: ₹25,000/day for trivial data entry typing',
        'Recruiter account unverified and reported for cyber scam activities',
        'Suspicious contact method via personal WhatsApp only'
      ],
      createdAt: '2026-11-12T16:00:00.000Z'
    },
    {
      id: 'job-8',
      title: '⚠️ VIP Parcel Inspector & Reshipper - Instant ₹1,20,000/Month',
      companyId: 'comp-3',
      companyName: 'Quick Cash India Solutions',
      recruiterId: 'usr-rec-3',
      location: 'Remote / Home Based (India)',
      type: 'Part-time',
      category: 'Logistics',
      salary: '₹1,20,000 / month',
      experience: 'None Required',
      description: 'Receive electronics and luxury packages at your home address in India, inspect them, repackage them, and dispatch via courier. Earn ₹1,500 per parcel handled! Contact on Telegram: @QuickCashIndia.',
      responsibilities: [
        'Receive parcels delivered to your residential address.',
        'Repackage items and ship them using provided prepaid labels.'
      ],
      requirements: [
        'Valid home address in India.',
        'Must not contact original merchants.'
      ],
      benefits: [
        'Keep extra merchandise',
        'High weekly cash payments via UPI'
      ],
      status: 'flagged',
      isFake: true,
      flagCount: 4,
      flagReasons: [
        'Known reshipping / parcel mule fraud scheme using stolen credit cards',
        'No legitimate Indian corporate registration (CIN / GST) found',
        'Contact via anonymous Telegram handle only'
      ],
      createdAt: '2026-11-13T10:30:00.000Z'
    }
  ],
  applications: [
    {
      id: 'app-1',
      jobId: 'job-1',
      jobTitle: 'Senior Full Stack Engineer',
      companyName: 'Nexus Tech India',
      recruiterId: 'usr-rec-1',
      seekerId: 'usr-seek-1',
      applicantName: 'Arjun Patel',
      applicantEmail: 'seeker@demo.com',
      applicantPhone: '+91 98765 43210',
      resumeUrl: '/uploads/resumes/sample-arjun-patel-resume.txt',
      resumeName: 'sample-arjun-patel-resume.txt',
      coverNote: 'Hello Nexus Tech team, I have 4+ years of full stack web engineering experience with Node.js and modern JavaScript in Bengaluru. I would love to contribute to your enterprise collaboration suite.',
      status: 'Shortlisted',
      recruiterNotes: 'Strong profile and relevant Node.js background. Technical interview scheduled for Thursday.',
      appliedAt: '2026-11-08T14:30:00.000Z',
      updatedAt: '2026-11-10T16:00:00.000Z'
    },
    {
      id: 'app-2',
      jobId: 'job-4',
      jobTitle: 'Frontend Developer (JavaScript / CSS)',
      companyName: 'Zenith Cloud Technologies',
      recruiterId: 'usr-rec-2',
      seekerId: 'usr-seek-1',
      applicantName: 'Arjun Patel',
      applicantEmail: 'seeker@demo.com',
      applicantPhone: '+91 98765 43210',
      resumeUrl: '/uploads/resumes/sample-arjun-patel-resume.txt',
      resumeName: 'sample-arjun-patel-resume.txt',
      coverNote: 'I specialize in clean HTML, responsive CSS, and modern vanilla JS. I have extensive experience building real-time dashboard applications.',
      status: 'Interviewing',
      recruiterNotes: 'Round 1 went exceptionally well. Candidate demonstrated deep CSS grid and event-driven JS knowledge.',
      appliedAt: '2026-11-09T11:00:00.000Z',
      updatedAt: '2026-11-11T09:20:00.000Z'
    },
    {
      id: 'app-3',
      jobId: 'job-2',
      jobTitle: 'Lead UI/UX Product Designer',
      companyName: 'Nexus Tech India',
      recruiterId: 'usr-rec-1',
      seekerId: 'usr-seek-2',
      applicantName: 'Ananya Iyer',
      applicantEmail: 'ananya@demo.com',
      applicantPhone: '+91 97654 32109',
      resumeUrl: '/uploads/resumes/sample-ananya-iyer-resume.txt',
      resumeName: 'sample-ananya-iyer-resume.txt',
      coverNote: 'I have designed several enterprise SaaS design systems and would love to bring my UX research and Figma token library experience to Nexus Tech.',
      status: 'Under Review',
      recruiterNotes: 'Portfolio looks impressive. Reviewing fintech case study details.',
      appliedAt: '2026-11-10T15:45:00.000Z',
      updatedAt: '2026-11-10T15:45:00.000Z'
    },
    {
      id: 'app-4',
      jobId: 'job-5',
      jobTitle: 'Data Analyst & Business Intelligence',
      companyName: 'Zenith Cloud Technologies',
      recruiterId: 'usr-rec-2',
      seekerId: 'usr-seek-3',
      applicantName: 'Rohan Kulkarni',
      applicantEmail: 'rohan@demo.com',
      applicantPhone: '+91 99887 76655',
      resumeUrl: '',
      resumeName: '',
      coverNote: 'Excited about the BI opening at Zenith Cloud! I have 2+ years of SQL data extraction and automated dashboard building experience.',
      status: 'Applied',
      recruiterNotes: 'Candidate applied recently. Awaiting initial recruiter screening.',
      appliedAt: '2026-11-12T09:10:00.000Z',
      updatedAt: '2026-11-12T09:10:00.000Z'
    }
  ]
};

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDb(INITIAL_DATA);
      return JSON.parse(JSON.stringify(INITIAL_DATA));
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning initial data fallback:', err);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function writeDb(data) {
  try {
    const tempPath = DB_PATH + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_PATH);
    return true;
  } catch (err) {
    console.error('Error writing db.json:', err);
    return false;
  }
}

// Function to force re-seed to Indian data
function resetToIndianData() {
  writeDb(INITIAL_DATA);
  return INITIAL_DATA;
}

module.exports = {
  readDb,
  writeDb,
  resetToIndianData,
  INITIAL_DATA,

  // USERS
  getUsers: () => readDb().users || [],
  getUserById: (id) => (readDb().users || []).find(u => u.id === id),
  getUserByEmail: (email) => (readDb().users || []).find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim()),
  createUser: (userData) => {
    const db = readDb();
    const newUser = {
      id: 'usr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      status: 'active',
      createdAt: new Date().toISOString(),
      ...userData
    };
    db.users.push(newUser);
    writeDb(db);
    return newUser;
  },
  updateUser: (id, updates) => {
    const db = readDb();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...updates, updatedAt: new Date().toISOString() };
    writeDb(db);
    return db.users[idx];
  },
  deleteUser: (id) => {
    const db = readDb();
    const initialLen = db.users.length;
    db.users = db.users.filter(u => u.id !== id);
    if (db.users.length !== initialLen) {
      // Also delete or flag associated jobs and applications
      db.jobs = db.jobs.filter(j => j.recruiterId !== id);
      db.applications = db.applications.filter(a => a.seekerId !== id);
      writeDb(db);
      return true;
    }
    return false;
  },

  // COMPANIES
  getCompanies: () => readDb().companies || [],
  getCompanyById: (id) => (readDb().companies || []).find(c => c.id === id),
  createCompany: (companyData) => {
    const db = readDb();
    const newComp = {
      id: 'comp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      verified: false,
      createdAt: new Date().toISOString(),
      ...companyData
    };
    db.companies.push(newComp);
    writeDb(db);
    return newComp;
  },
  updateCompany: (id, updates) => {
    const db = readDb();
    const idx = db.companies.findIndex(c => c.id === id);
    if (idx === -1) return null;
    db.companies[idx] = { ...db.companies[idx], ...updates, updatedAt: new Date().toISOString() };
    writeDb(db);
    return db.companies[idx];
  },
  deleteCompany: (id) => {
    const db = readDb();
    const initialLen = db.companies.length;
    db.companies = db.companies.filter(c => c.id !== id);
    if (db.companies.length !== initialLen) {
      db.jobs = db.jobs.filter(j => j.companyId !== id);
      writeDb(db);
      return true;
    }
    return false;
  },

  // JOBS
  getJobs: (includeFake = false) => {
    const db = readDb();
    const jobs = db.jobs || [];
    if (includeFake) return jobs;
    return jobs.filter(j => !j.isFake && j.status !== 'flagged');
  },
  getAllJobsAdmin: () => readDb().jobs || [],
  getJobById: (id) => (readDb().jobs || []).find(j => j.id === id),
  createJob: (jobData) => {
    const db = readDb();
    const newJob = {
      id: 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      status: 'active',
      isFeatured: false,
      isFake: false,
      flagCount: 0,
      flagReasons: [],
      createdAt: new Date().toISOString(),
      ...jobData
    };
    db.jobs.unshift(newJob);
    writeDb(db);
    return newJob;
  },
  updateJob: (id, updates) => {
    const db = readDb();
    const idx = db.jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    db.jobs[idx] = { ...db.jobs[idx], ...updates, updatedAt: new Date().toISOString() };
    writeDb(db);
    return db.jobs[idx];
  },
  deleteJob: (id) => {
    const db = readDb();
    const initialLen = db.jobs.length;
    db.jobs = db.jobs.filter(j => j.id !== id);
    if (db.jobs.length !== initialLen) {
      db.applications = db.applications.filter(a => a.jobId !== id);
      writeDb(db);
      return true;
    }
    return false;
  },
  reportFakeJob: (id, reason, reporterEmail) => {
    const db = readDb();
    const job = db.jobs.find(j => j.id === id);
    if (!job) return null;
    job.flagCount = (job.flagCount || 0) + 1;
    if (!job.flagReasons) job.flagReasons = [];
    job.flagReasons.push(reason + (reporterEmail ? ` (reported by: ${reporterEmail})` : ''));
    if (job.flagCount >= 2) {
      job.status = 'flagged';
      job.isFake = true;
    }
    writeDb(db);
    return job;
  },

  // APPLICATIONS
  getApplications: () => readDb().applications || [],
  getApplicationById: (id) => (readDb().applications || []).find(a => a.id === id),
  getApplicationsBySeeker: (seekerId) => (readDb().applications || []).filter(a => a.seekerId === seekerId),
  getApplicationsByJob: (jobId) => (readDb().applications || []).filter(a => a.jobId === jobId),
  getApplicationsByRecruiter: (recruiterId) => (readDb().applications || []).filter(a => a.recruiterId === recruiterId),
  createApplication: (appData) => {
    const db = readDb();
    const exists = db.applications.find(a => a.jobId === appData.jobId && a.seekerId === appData.seekerId);
    if (exists) {
      throw new Error('You have already applied for this job.');
    }
    const newApp = {
      id: 'app-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      status: 'Applied',
      recruiterNotes: 'Application received and pending review.',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...appData
    };
    db.applications.unshift(newApp);
    writeDb(db);
    return newApp;
  },
  updateApplicationStatus: (id, status, notes) => {
    const db = readDb();
    const idx = db.applications.findIndex(a => a.id === id);
    if (idx === -1) return null;
    db.applications[idx].status = status;
    if (notes !== undefined) {
      db.applications[idx].recruiterNotes = notes;
    }
    db.applications[idx].updatedAt = new Date().toISOString();
    writeDb(db);
    return db.applications[idx];
  },
  deleteApplication: (id) => {
    const db = readDb();
    const initialLen = db.applications.length;
    db.applications = db.applications.filter(a => a.id !== id);
    if (db.applications.length !== initialLen) {
      writeDb(db);
      return true;
    }
    return false;
  },

  // STATS
  getStats: () => {
    const db = readDb();
    const users = db.users || [];
    const jobs = db.jobs || [];
    const companies = db.companies || [];
    const applications = db.applications || [];

    const seekersCount = users.filter(u => u.role === 'seeker').length;
    const recruitersCount = users.filter(u => u.role === 'recruiter').length;
    const activeJobsCount = jobs.filter(j => !j.isFake && j.status === 'active').length;
    const fakeJobsCount = jobs.filter(j => j.isFake || j.status === 'flagged').length;

    return {
      totalUsers: users.length,
      totalSeekers: seekersCount,
      totalRecruiters: recruitersCount,
      totalCompanies: companies.length,
      totalJobs: jobs.length,
      activeJobs: activeJobsCount,
      fakeJobs: fakeJobsCount,
      totalApplications: applications.length
    };
  }
};

// Auto sync on start
resetToIndianData();
