/**
 * ADMIN DASHBOARD SCRIPT
 * Comprehensive control center: Users, Companies, Jobs, Applications & Fake Job Deletion.
 */

let allUsers = [];
let allCompanies = [];
let allJobs = [];
let allFakeJobs = [];
let allApplications = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  await loadAdminStats();
  await loadFakeJobs();
  await loadUsers();
  await loadCompanies();
  await loadAllJobs();
  await loadApplications();

  // User role filter
  document.getElementById('filter-user-role').addEventListener('change', renderUsersTable);

  // User search input
  const userSearch = document.getElementById('admin-users-search');
  if (userSearch) userSearch.addEventListener('input', renderUsersTable);

  // Search jobs
  document.getElementById('admin-jobs-search').addEventListener('input', renderJobsTable);

  // Delete fake job modal form
  document.getElementById('delete-fake-form').addEventListener('submit', handleConfirmDeleteFake);
});

function setupTabs() {
  const links = document.querySelectorAll('.sidebar-link[data-tab]');
  links.forEach(link => {
    link.addEventListener('click', () => {
      const target = link.getAttribute('data-tab');
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
      const targetPane = document.getElementById(`tab-content-${target}`);
      if (targetPane) targetPane.style.display = 'block';
    });
  });

  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab) {
    const btn = document.querySelector(`.sidebar-link[data-tab="${tab}"]`);
    if (btn) btn.click();
  }
}

async function loadAdminStats() {
  const user = api.getUser();
  if (user) {
    document.getElementById('admin-name').textContent = user.name || 'System Admin';
  }

  try {
    const res = await api.get('/admin/stats');
    const s = res.stats;

    document.getElementById('adm-stat-users').textContent = s.totalUsers || 0;
    document.getElementById('adm-stat-companies').textContent = s.totalCompanies || 0;
    document.getElementById('adm-stat-jobs').textContent = s.totalJobs || 0;
    document.getElementById('adm-stat-fake').textContent = s.fakeJobs || 0;

    document.getElementById('badge-fake-count').textContent = s.fakeJobs || 0;
    document.getElementById('badge-user-count').textContent = s.totalUsers || 0;
    document.getElementById('badge-comp-count').textContent = s.totalCompanies || 0;
    document.getElementById('badge-job-count').textContent = s.totalJobs || 0;
    document.getElementById('badge-app-count').textContent = s.totalApplications || 0;
  } catch (err) {
    console.warn('Stats error:', err);
  }
}

// ==========================================
// 1. FAKE JOBS QUEUE & DELETION (CORE FEATURE)
// ==========================================

async function loadFakeJobs() {
  const container = document.getElementById('fake-jobs-list-container');
  try {
    const res = await api.get('/admin/fake-jobs');
    allFakeJobs = res.jobs || [];

    document.getElementById('badge-fake-count').textContent = allFakeJobs.length;
    document.getElementById('adm-stat-fake').textContent = allFakeJobs.length;

    if (allFakeJobs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" style="color: #10b981;">🛡️</div>
          <h3 class="empty-state-title">No Fake or Flagged Jobs</h3>
          <p class="empty-state-desc">The job queue is clean. All active postings meet platform community and verification standards.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = allFakeJobs.map(renderFakeJobAlert).join('');
  } catch (err) {
    container.innerHTML = `<div style="color: #ef4444; padding: 20px;">Failed to load fake jobs: ${escapeHtml(err.message)}</div>`;
  }
}

function renderFakeJobAlert(job) {
  const reasons = (job.flagReasons && job.flagReasons.length > 0)
    ? job.flagReasons
    : ['User reported for suspicious activity', 'Demanded upfront money / scam patterns detected'];

  return `
    <div class="fake-job-alert-card">
      <div class="fake-job-header">
        <div>
          <div class="fake-job-title">
            <span>🚨</span>
            <span>${escapeHtml(job.title)}</span>
          </div>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
            Company: <strong>${escapeHtml(job.companyName)}</strong> &bull; Location: ${escapeHtml(job.location || 'Remote')} &bull; Salary Claim: <strong style="color: #b91c1c;">${escapeHtml(job.salary)}</strong>
          </div>
        </div>
        <span class="badge badge-danger" style="font-size: 13px; padding: 6px 12px;">
          Flagged (${job.flagCount || 1} Reports)
        </span>
      </div>

      <div class="fake-reasons-box">
        <div class="fake-reasons-title">⚠️ Identified Fraud Risk Factors & User Reports:</div>
        <ul class="fake-reasons-list">
          ${reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>
      </div>

      <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px; background: #fff; padding: 10px; border-radius: var(--radius-sm); border: 1px dashed #fca5a5;">
        <strong>Job Snippet:</strong> ${escapeHtml(job.description ? job.description.substring(0, 200) + '...' : '')}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1px solid #fee2e2; padding-top: 14px;">
        <span style="font-size: 12px; color: var(--text-muted);">
          Recruiter ID: <code>${job.recruiterId || 'N/A'}</code> &bull; Posted: ${formatDate(job.createdAt)}
        </span>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="dismissJobFlag('${job.id}')">
            Dismiss Flags (Safe)
          </button>
          <button type="button" class="btn btn-danger btn-sm" onclick="triggerDeleteFakeModal('${job.id}', '${escapeHtml(job.title).replace(/'/g, "\\'")}')">
            🗑️ Delete Fake Job Post
          </button>
        </div>
      </div>
    </div>
  `;
}

function triggerDeleteFakeModal(jobId, jobTitle) {
  document.getElementById('delete-fake-job-id').value = jobId;
  document.getElementById('delete-fake-job-title').textContent = jobTitle;
  document.getElementById('check-ban-recruiter').checked = true;
  openModal('delete-fake-modal');
}

async function handleConfirmDeleteFake(e) {
  e.preventDefault();
  const jobId = document.getElementById('delete-fake-job-id').value;
  const banRecruiter = document.getElementById('check-ban-recruiter').checked;
  const submitBtn = document.getElementById('btn-confirm-delete-fake');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Deleting...';

  try {
    const res = await api.delete(`/admin/jobs/${jobId}/fake`, { banRecruiter });
    showToast(res.message || 'Fake job post permanently deleted.', 'success');
    closeModal('delete-fake-modal');

    await Promise.all([
      loadFakeJobs(),
      loadAllJobs(),
      loadUsers(),
      loadAdminStats()
    ]);
  } catch (err) {
    showToast(err.message || 'Failed to delete fake job.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirm Delete Fake Job';
  }
}

async function dismissJobFlag(jobId) {
  if (!confirm('Mark this job as safe and dismiss all user reports?')) return;

  try {
    const res = await api.put(`/admin/jobs/${jobId}/dismiss-flag`);
    showToast(res.message || 'Job restored as active.', 'success');
    await loadFakeJobs();
    await loadAllJobs();
    await loadAdminStats();
  } catch (err) {
    showToast(err.message || 'Failed to dismiss flags.', 'error');
  }
}

// ==========================================
// 2. MANAGE USERS
// ==========================================

async function loadUsers() {
  const tbody = document.getElementById('admin-users-tbody');
  try {
    const res = await api.get('/admin/users');
    allUsers = res.users || [];
    renderUsersTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: #ef4444; text-align: center;">Error loading users: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('admin-users-tbody');
  const roleFilter = document.getElementById('filter-user-role').value;
  const searchInput = document.getElementById('admin-users-search');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let list = allUsers;
  if (roleFilter !== 'all') {
    list = list.filter(u => u.role === roleFilter);
  }

  if (query) {
    list = list.filter(u =>
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.phone && u.phone.toLowerCase().includes(query)) ||
      (u.companyName && u.companyName.toLowerCase().includes(query)) ||
      (u.title && u.title.toLowerCase().includes(query)) ||
      (u.skills && Array.isArray(u.skills) && u.skills.some(s => s.toLowerCase().includes(query)))
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">No users found matching your search.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(user => {
    const isSuspended = user.status === 'suspended';
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

    let headlineInfo = '<span style="color: var(--text-muted); font-size: 13px;">—</span>';
    let metaBadge = '';

    if (user.role === 'seeker') {
      headlineInfo = `
        <div style="font-size: 13px; font-weight: 600; color: var(--secondary);">${escapeHtml(user.title || 'Job Seeker')}</div>
        ${user.skills && user.skills.length > 0 ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Skills: ${escapeHtml(user.skills.slice(0, 3).join(', '))}${user.skills.length > 3 ? '...' : ''}</div>` : ''}
      `;
      metaBadge = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span class="badge badge-primary">${user.applicationsCount || 0} Applications</span>
          ${user.resumeUrl ? `<a href="${user.resumeUrl}" target="_blank" style="font-size: 11px; color: #2563eb; text-decoration: underline;">📄 View Resume</a>` : '<span style="font-size: 11px; color: var(--text-muted);">No resume</span>'}
        </div>
      `;
    } else if (user.role === 'recruiter') {
      headlineInfo = `
        <div style="font-size: 13px; font-weight: 700; color: #1e40af;">🏢 ${escapeHtml(user.companyName || 'Company')}</div>
        ${user.company && user.company.website ? `<a href="${user.company.website}" target="_blank" style="font-size: 11px; color: var(--text-muted); text-decoration: underline;">${escapeHtml(user.company.website)}</a>` : ''}
      `;
      metaBadge = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <span class="badge badge-purple">${user.jobsCount || 0} Jobs Posted</span>
          <span style="font-size: 11px; color: var(--text-muted);">${user.totalApplicantsReceived || 0} Total Applicants</span>
        </div>
      `;
    } else {
      headlineInfo = `<div style="font-size: 13px; font-weight: 600; color: #b91c1c;">System Administrator</div>`;
      metaBadge = `<span class="badge badge-danger">Superuser</span>`;
    }

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: ${user.role === 'recruiter' ? '#ede9fe' : (user.role === 'admin' ? '#fee2e2' : '#dbeafe')}; color: ${user.role === 'recruiter' ? '#6d28d9' : (user.role === 'admin' ? '#b91c1c' : '#1d4ed8')}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">
              ${initials}
            </div>
            <div>
              <div style="font-weight: 700; color: var(--secondary); font-size: 14px;">${escapeHtml(user.name)}</div>
              <span class="badge ${user.role === 'admin' ? 'badge-danger' : (user.role === 'recruiter' ? 'badge-purple' : 'badge-primary')}" style="font-size: 10px; padding: 2px 6px;">
                ${user.role}
              </span>
            </div>
          </div>
        </td>
        <td>
          <div style="font-size: 13px; color: var(--text-main); font-weight: 500;">${escapeHtml(user.email)}</div>
          <div style="font-size: 12px; color: var(--text-muted);">📞 ${escapeHtml(user.phone || 'No phone')}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Joined: ${formatDate(user.createdAt)}</div>
        </td>
        <td>${headlineInfo}</td>
        <td>${metaBadge}</td>
        <td>
          <span class="badge ${isSuspended ? 'badge-danger' : 'badge-success'}">
            ${user.status || 'active'}
          </span>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <button type="button" class="btn btn-primary btn-sm" onclick="openUserDossierModal('${user.id}')" style="font-size: 12px; padding: 4px 10px;">
              👁️ View All Info
            </button>
            ${user.role === 'admin' ? '' : `
              <div style="display: flex; gap: 4px;">
                <button type="button" class="btn btn-outline btn-sm" onclick="toggleUserStatus('${user.id}', '${isSuspended ? 'active' : 'suspended'}')" style="font-size: 11px; padding: 3px 6px;">
                  ${isSuspended ? 'Activate' : 'Suspend'}
                </button>
                <button type="button" class="btn btn-outline btn-sm" onclick="deleteUser('${user.id}')" style="font-size: 11px; padding: 3px 6px; color: #ef4444; border-color: #fecaca;">
                  Delete
                </button>
              </div>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Open Full User Dossier (Website Owner 360-degree inspection)
async function openUserDossierModal(userId) {
  const modalBody = document.getElementById('user-dossier-body');
  const modalFooterActions = document.getElementById('dossier-quick-actions');
  
  modalBody.innerHTML = `
    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
      Loading complete user profile and activity records...
    </div>
  `;
  modalFooterActions.innerHTML = '';
  openModal('user-dossier-modal');

  try {
    const data = await api.get(`/admin/users/${userId}/details`);
    const user = data.user;
    const isSuspended = user.status === 'suspended';
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

    // Footer actions
    if (user.role !== 'admin') {
      modalFooterActions.innerHTML = `
        <button type="button" class="btn ${isSuspended ? 'btn-success' : 'btn-warning'} btn-sm" onclick="toggleUserStatus('${user.id}', '${isSuspended ? 'active' : 'suspended'}'); closeModal('user-dossier-modal');">
          ${isSuspended ? '✓ Reactivate Account' : '⚠️ Suspend Account'}
        </button>
        <button type="button" class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}'); closeModal('user-dossier-modal');">
          🗑️ Delete User Permanently
        </button>
      `;
    }

    let roleSpecificHtml = '';

    // ===================================
    // CASE A: JOB SEEKER DOSSIER
    // ===================================
    if (user.role === 'seeker') {
      const apps = data.applications || [];
      const skillsHtml = user.skills && user.skills.length > 0 
        ? user.skills.map(s => `<span class="badge badge-primary" style="font-size: 12px; margin-right: 4px; margin-bottom: 4px;">${escapeHtml(s)}</span>`).join('') 
        : '<span style="color: var(--text-muted);">No skills listed</span>';

      roleSpecificHtml = `
        <!-- Professional Overview -->
        <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; margin-bottom: 18px;">
          <h4 style="font-size: 14px; font-weight: 700; color: var(--secondary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
            🎯 Candidate Career Overview
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
            <div>
              <span style="font-size: 12px; color: var(--text-muted); display: block;">TARGET ROLE / HEADLINE</span>
              <strong style="font-size: 14px; color: var(--secondary);">${escapeHtml(user.title || 'Not specified')}</strong>
            </div>
            <div>
              <span style="font-size: 12px; color: var(--text-muted); display: block;">TOTAL APPLICATIONS SUBMITTED</span>
              <strong style="font-size: 16px; color: #2563eb;">${apps.length} Applications</strong>
            </div>
          </div>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 6px;">CANDIDATE SKILLS</span>
            <div>${skillsHtml}</div>
          </div>

          <div>
            <span style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">BIOGRAPHY / SUMMARY</span>
            <p style="font-size: 13px; color: var(--text-main); line-height: 1.5; background: #f8fafc; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
              ${escapeHtml(user.bio || 'No personal bio provided.')}
            </p>
          </div>
        </div>

        <!-- Resume File Card -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-md); padding: 16px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 28px;">📄</div>
            <div>
              <div style="font-size: 14px; font-weight: 700; color: #1e40af;">Candidate Resume File</div>
              <div style="font-size: 12px; color: #1e3a8a;">
                ${user.resumeUrl ? `${escapeHtml(user.resumeName || 'resume.pdf')} (Ready for download)` : 'No resume uploaded by this candidate yet.'}
              </div>
            </div>
          </div>
          ${user.resumeUrl ? `
            <a href="${user.resumeUrl}" target="_blank" class="btn btn-primary btn-sm" style="font-weight: 700;">
              ⬇️ Preview / Download Resume
            </a>
          ` : '<span class="badge badge-warning">Missing Resume</span>'}
        </div>

        <!-- Applications History Table -->
        <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px;">
          <h4 style="font-size: 14px; font-weight: 700; color: var(--secondary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
            📋 Complete Application History (${apps.length})
          </h4>
          ${apps.length === 0 ? `
            <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">
              This candidate has not applied for any jobs yet.
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table" style="font-size: 13px;">
                <thead>
                  <tr>
                    <th>Job Title & Company</th>
                    <th>Date Applied</th>
                    <th>Status</th>
                    <th>Recruiter Feedback / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${apps.map(a => `
                    <tr>
                      <td>
                        <div style="font-weight: 700; color: var(--secondary);">${escapeHtml(a.jobTitle)}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">🏢 ${escapeHtml(a.companyName)}</div>
                      </td>
                      <td>${formatDate(a.appliedAt)}</td>
                      <td>${getStatusBadge(a.status)}</td>
                      <td style="font-size: 12px; color: var(--text-muted); max-width: 250px;">
                        ${escapeHtml(a.recruiterNotes || 'Awaiting review')}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    }

    // ===================================
    // CASE B: RECRUITER / COMPANY DOSSIER
    // ===================================
    else if (user.role === 'recruiter') {
      const comp = data.company;
      const jobs = data.jobs || [];

      roleSpecificHtml = `
        <!-- Company Profile Block -->
        <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <h4 style="font-size: 16px; font-weight: 800; color: var(--secondary);">
                🏢 ${escapeHtml(comp ? comp.name : (user.companyName || 'Unregistered Company'))}
              </h4>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                Industry: <strong>${escapeHtml(comp ? comp.industry : 'N/A')}</strong> &bull; Size: <strong>${escapeHtml(comp ? comp.size : 'N/A')}</strong>
              </div>
            </div>
            <div>
              <span class="badge ${comp && comp.verified ? 'badge-success' : 'badge-warning'}">
                ${comp && comp.verified ? 'Verified Employer ✓' : 'Unverified'}
              </span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; font-size: 13px;">
            <div>
              <span style="color: var(--text-muted); display: block; font-size: 11px;">HEADQUARTERS</span>
              <strong>${escapeHtml(comp ? comp.location : 'Remote')}</strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block; font-size: 11px;">COMPANY WEBSITE</span>
              ${comp && comp.website ? `<a href="${comp.website}" target="_blank" style="color: #2563eb; text-decoration: underline;">${escapeHtml(comp.website)}</a>` : '<span style="color: var(--text-muted);">None</span>'}
            </div>
          </div>

          <div>
            <span style="color: var(--text-muted); display: block; font-size: 11px; margin-bottom: 4px;">ABOUT THE COMPANY</span>
            <p style="font-size: 13px; color: var(--text-main); line-height: 1.5; background: #f8fafc; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border);">
              ${escapeHtml(comp ? comp.description : 'No company description provided.')}
            </p>
          </div>
        </div>

        <!-- Recruiter Performance Metrics -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;">
          <div style="padding: 16px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: var(--radius-md);">
            <div style="font-size: 12px; color: #6d28d9; font-weight: 700;">TOTAL JOBS POSTED</div>
            <div style="font-size: 26px; font-weight: 800; color: #5b21b6; margin-top: 4px;">${jobs.length}</div>
          </div>
          <div style="padding: 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-md);">
            <div style="font-size: 12px; color: #047857; font-weight: 700;">TOTAL APPLICANTS RECEIVED</div>
            <div style="font-size: 26px; font-weight: 800; color: #065f46; margin-top: 4px;">${data.totalApplicantsReceived || 0}</div>
          </div>
        </div>

        <!-- Jobs Posted Table -->
        <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px;">
          <h4 style="font-size: 14px; font-weight: 700; color: var(--secondary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
            💼 Jobs Posted by this Recruiter (${jobs.length})
          </h4>
          ${jobs.length === 0 ? `
            <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">
              This recruiter has not published any jobs yet.
            </div>
          ` : `
            <div class="table-responsive">
              <table class="data-table" style="font-size: 13px;">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Category & Type</th>
                    <th>Salary</th>
                    <th>Candidates</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${jobs.map(j => `
                    <tr>
                      <td>
                        <div style="font-weight: 700; color: var(--secondary);">${escapeHtml(j.title)}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">📍 ${escapeHtml(j.location)}</div>
                      </td>
                      <td>
                        <span class="badge badge-gray">${escapeHtml(j.category)}</span>
                        <span class="badge badge-gray">${escapeHtml(j.type)}</span>
                      </td>
                      <td style="font-weight: 600;">${escapeHtml(j.salary)}</td>
                      <td>
                        <span class="badge badge-primary">${j.applicantCount || 0} Applicants</span>
                      </td>
                      <td>
                        ${j.isFake || j.status === 'flagged' ? '<span class="badge badge-danger">🚨 Fake/Flagged</span>' : getStatusBadge(j.status)}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    }

    // ===================================
    // CASE C: ADMIN
    // ===================================
    else {
      roleSpecificHtml = `
        <div style="padding: 20px; background: #fff5f5; border: 1px solid #fecaca; border-radius: var(--radius-md);">
          <strong style="color: #b91c1c;">System Administrator Account:</strong>
          <p style="font-size: 13px; color: #7f1d1d; margin-top: 4px;">
            This is an executive platform superuser with full permissions across user management, job moderation, and fraud enforcement.
          </p>
        </div>
      `;
    }

    // Render Full Dossier
    modalBody.innerHTML = `
      <!-- User Profile Header Card -->
      <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: ${user.role === 'recruiter' ? '#6d28d9' : (user.role === 'admin' ? '#dc2626' : '#2563eb')}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800;">
            ${initials}
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="font-size: 20px; font-weight: 800; color: var(--secondary); margin-bottom: 2px;">
                ${escapeHtml(user.name)}
              </h3>
              <span class="badge ${user.role === 'admin' ? 'badge-danger' : (user.role === 'recruiter' ? 'badge-purple' : 'badge-primary')}">
                ${user.role.toUpperCase()}
              </span>
              <span class="badge ${isSuspended ? 'badge-danger' : 'badge-success'}">
                ${user.status.toUpperCase()}
              </span>
            </div>
            <div style="font-size: 13px; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 14px; margin-top: 4px;">
              <span>✉️ ${escapeHtml(user.email)}</span>
              <span>📞 ${escapeHtml(user.phone || 'No phone provided')}</span>
              <span>📅 Joined: ${formatDate(user.createdAt)}</span>
              <span>🔑 ID: <code>${user.id}</code></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Specific Role Intelligence Content -->
      ${roleSpecificHtml}
    `;

  } catch (err) {
    modalBody.innerHTML = `
      <div style="color: #ef4444; padding: 30px; text-align: center;">
        Failed to load user dossier: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

async function toggleUserStatus(userId, newStatus) {
  try {
    const res = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
    showToast(res.message || 'Status updated.', 'success');
    await loadUsers();
    await loadAdminStats();
  } catch (err) {
    showToast(err.message || 'Failed to change user status.', 'error');
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to permanently delete this user and all associated jobs/applications?')) return;

  try {
    const res = await api.delete(`/admin/users/${userId}`);
    showToast(res.message || 'User deleted successfully.', 'success');
    await loadUsers();
    await loadAllJobs();
    await loadFakeJobs();
    await loadApplications();
    await loadAdminStats();
  } catch (err) {
    showToast(err.message || 'Failed to delete user.', 'error');
  }
}

// ==========================================
// 3. MANAGE COMPANIES
// ==========================================

async function loadCompanies() {
  const tbody = document.getElementById('admin-companies-tbody');
  try {
    const res = await api.get('/admin/companies');
    allCompanies = res.companies || [];

    if (allCompanies.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">No companies found.</td></tr>`;
      return;
    }

    tbody.innerHTML = allCompanies.map(c => `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--secondary); font-size: 15px;">${escapeHtml(c.name)}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(c.description ? c.description.substring(0, 60) + '...' : '')}</div>
        </td>
        <td>
          <div style="font-size: 13px; font-weight: 600;">${escapeHtml(c.industry || 'Technology')}</div>
          <div style="font-size: 12px; color: var(--text-muted);">📍 ${escapeHtml(c.location || 'Remote')}</div>
        </td>
        <td>
          ${c.website ? `<a href="${c.website}" target="_blank" style="font-size: 13px; text-decoration: underline;">${escapeHtml(c.website)}</a>` : '<span style="color: var(--text-muted); font-size: 13px;">None</span>'}
        </td>
        <td>
          <span class="badge badge-gray">${c.jobCount || 0} Openings</span>
        </td>
        <td>
          <span class="badge ${c.verified ? 'badge-success' : 'badge-warning'}">
            ${c.verified ? 'Verified ✓' : 'Unverified'}
          </span>
          ${c.hasFakeJobs ? '<span class="badge badge-danger" style="margin-left: 4px;">⚠️ Fake Jobs</span>' : ''}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="toggleCompanyVerify('${c.id}', ${!c.verified})">
              ${c.verified ? 'Revoke Verification' : 'Verify Company'}
            </button>
            <button type="button" class="btn btn-outline btn-sm" onclick="deleteCompany('${c.id}')" style="color: #ef4444; border-color: #fecaca;">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: #ef4444; text-align: center;">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function toggleCompanyVerify(companyId, verified) {
  try {
    const res = await api.put(`/admin/companies/${companyId}/verify`, { verified });
    showToast(res.message || 'Company verification updated.', 'success');
    await loadCompanies();
  } catch (err) {
    showToast(err.message || 'Failed to update company.', 'error');
  }
}

async function deleteCompany(companyId) {
  if (!confirm('Are you sure you want to delete this company and all its job postings?')) return;

  try {
    const res = await api.delete(`/admin/companies/${companyId}`);
    showToast(res.message || 'Company deleted.', 'success');
    await loadCompanies();
    await loadAllJobs();
    await loadFakeJobs();
    await loadAdminStats();
  } catch (err) {
    showToast(err.message || 'Failed to delete company.', 'error');
  }
}

// ==========================================
// 4. MANAGE ALL JOBS
// ==========================================

async function loadAllJobs() {
  const tbody = document.getElementById('admin-jobs-tbody');
  try {
    const res = await api.get('/admin/jobs');
    allJobs = res.jobs || [];
    renderJobsTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: #ef4444; text-align: center;">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderJobsTable() {
  const tbody = document.getElementById('admin-jobs-tbody');
  const query = document.getElementById('admin-jobs-search').value.toLowerCase().trim();

  let list = allJobs;
  if (query) {
    list = list.filter(j =>
      (j.title && j.title.toLowerCase().includes(query)) ||
      (j.companyName && j.companyName.toLowerCase().includes(query))
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">No jobs found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(job => `
    <tr>
      <td>
        <div style="font-weight: 700; color: var(--secondary); font-size: 15px;">
          ${escapeHtml(job.title)}
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">ID: <code>${job.id}</code></div>
      </td>
      <td style="font-weight: 600;">${escapeHtml(job.companyName)}</td>
      <td>
        <span class="badge badge-gray">${escapeHtml(job.category)}</span>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">📍 ${escapeHtml(job.location || 'Remote')}</div>
      </td>
      <td>
        <span class="badge badge-gray">${job.applicantCount || 0} Applicants</span>
      </td>
      <td>
        ${job.isFake || job.status === 'flagged' 
          ? '<span class="badge badge-danger">🚨 Fake / Flagged</span>' 
          : getStatusBadge(job.status)}
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          <a href="/job-details.html?id=${job.id}" target="_blank" class="btn btn-outline btn-sm">View</a>
          <button type="button" class="btn btn-outline btn-sm" onclick="deleteJobAdmin('${job.id}')" style="color: #ef4444; border-color: #fecaca;">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

async function deleteJobAdmin(jobId) {
  if (!confirm('Are you sure you want to delete this job post?')) return;

  try {
    const res = await api.delete(`/jobs/${jobId}`);
    showToast(res.message || 'Job deleted.', 'success');
    await loadAllJobs();
    await loadFakeJobs();
    await loadAdminStats();
  } catch (err) {
    showToast(err.message || 'Failed to delete job.', 'error');
  }
}

// ==========================================
// 5. VIEW ALL APPLICATIONS
// ==========================================

async function loadApplications() {
  const tbody = document.getElementById('admin-applications-tbody');
  try {
    const res = await api.get('/admin/applications');
    allApplications = res.applications || [];

    if (allApplications.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">No applications found.</td></tr>`;
      return;
    }

    tbody.innerHTML = allApplications.map(app => `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--secondary); font-size: 15px;">${escapeHtml(app.applicantName)}</div>
          <div style="font-size: 13px; color: var(--text-muted);">${escapeHtml(app.applicantEmail)}</div>
          ${app.applicantPhone ? `<div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(app.applicantPhone)}</div>` : ''}
        </td>
        <td>
          <div style="font-weight: 700; color: var(--secondary);">${escapeHtml(app.jobTitle)}</div>
          <div style="font-size: 13px; color: var(--text-muted);">🏢 ${escapeHtml(app.companyName)}</div>
        </td>
        <td>
          <a href="${app.resumeUrl}" target="_blank" class="btn btn-outline btn-sm" style="font-weight: 600;">
            📄 View Resume
          </a>
        </td>
        <td>${getStatusBadge(app.status)}</td>
        <td style="font-size: 13px; color: var(--text-muted);">${formatDate(app.appliedAt)}</td>
        <td style="font-size: 12px; color: var(--text-muted); max-width: 200px;">
          ${escapeHtml(app.recruiterNotes || app.coverNote || 'None')}
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: #ef4444; text-align: center;">Error loading applications: ${escapeHtml(err.message)}</td></tr>`;
  }
}
