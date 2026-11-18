/**
 * RECRUITER & COMPANY DASHBOARD LOGIC
 */

let myJobs = [];
let allRecruiterApplicants = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  await loadRecruiterData();

  // Post Job Form
  document.getElementById('post-job-form').addEventListener('submit', handlePostJob);

  // Edit Job Form
  document.getElementById('edit-job-form').addEventListener('submit', handleEditJobSubmit);

  // Update Status Form
  document.getElementById('update-status-form').addEventListener('submit', handleStatusSubmit);

  // Company Profile Form
  document.getElementById('recruiter-company-form').addEventListener('submit', handleCompanyUpdate);

  // Filter applicants by job
  document.getElementById('filter-app-job-select').addEventListener('change', renderApplicantsTable);
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

async function loadRecruiterData() {
  const user = api.getUser();
  if (!user) return;

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RC';
  document.getElementById('recruiter-avatar').textContent = initials;
  document.getElementById('recruiter-name').textContent = user.name;
  document.getElementById('recruiter-company').textContent = user.companyName || 'Company Recruiter';

  await Promise.all([
    loadJobs(),
    loadApplicants(),
    loadCompanyProfile()
  ]);
}

async function loadJobs() {
  const tbody = document.getElementById('recruiter-jobs-tbody');
  const filterSelect = document.getElementById('filter-app-job-select');

  try {
    const res = await api.get('/recruiter/jobs');
    myJobs = res.jobs || [];

    document.getElementById('badge-my-jobs-count').textContent = myJobs.length;
    document.getElementById('rec-stat-active-jobs').textContent = myJobs.filter(j => j.status === 'active').length;

    // Populate filter dropdown in applicants tab
    filterSelect.innerHTML = `<option value="all">All Jobs (${myJobs.length})</option>` +
      myJobs.map(j => `<option value="${j.id}">${escapeHtml(j.title)} (${j.applicantCount || 0})</option>`).join('');

    if (myJobs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
            You haven't posted any jobs yet. Click "Post New Job" above to get started!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = myJobs.map(job => `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--secondary); font-size: 15px;">
            ${escapeHtml(job.title)}
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">📍 ${escapeHtml(job.location)} &bull; ID: ${job.id}</div>
        </td>
        <td>
          <span class="badge badge-gray">${escapeHtml(job.category)}</span>
          <span class="badge badge-gray">${escapeHtml(job.type)}</span>
        </td>
        <td style="font-weight: 600;">${escapeHtml(job.salary)}</td>
        <td>
          <button type="button" class="btn btn-outline btn-sm" onclick="filterApplicantsForJob('${job.id}')" style="font-weight: 700;">
            👥 ${job.applicantCount || 0} Applicants
          </button>
        </td>
        <td>${getStatusBadge(job.status)}</td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="openEditJobModal('${job.id}')">Edit</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="deleteJob('${job.id}')" style="color: #ef4444; border-color: #fecaca;">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: #ef4444; text-align: center;">Error loading jobs: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadApplicants() {
  const tbody = document.getElementById('recruiter-applicants-tbody');
  try {
    const res = await api.get('/applications/recruiter');
    allRecruiterApplicants = res.applications || [];

    document.getElementById('badge-total-applicants').textContent = allRecruiterApplicants.length;
    document.getElementById('rec-stat-applicants').textContent = allRecruiterApplicants.length;

    const shortlisted = allRecruiterApplicants.filter(a => ['Shortlisted', 'Interviewing'].includes(a.status)).length;
    document.getElementById('rec-stat-shortlisted').textContent = shortlisted;

    renderApplicantsTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: #ef4444; text-align: center;">Error loading applicants: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderApplicantsTable() {
  const tbody = document.getElementById('recruiter-applicants-tbody');
  const selectedJobId = document.getElementById('filter-app-job-select').value;

  let list = allRecruiterApplicants;
  if (selectedJobId !== 'all') {
    list = list.filter(a => a.jobId === selectedJobId);
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
          No applicants found for the selected filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(app => `
    <tr>
      <td>
        <div style="font-weight: 700; color: var(--secondary); font-size: 15px;">${escapeHtml(app.applicantName)}</div>
        <div style="font-size: 13px; color: var(--text-muted);">${escapeHtml(app.applicantEmail)}</div>
        ${app.applicantPhone ? `<div style="font-size: 12px; color: var(--text-muted);">${escapeHtml(app.applicantPhone)}</div>` : ''}
      </td>
      <td>
        <div style="font-weight: 600; color: var(--secondary);">${escapeHtml(app.jobTitle)}</div>
      </td>
      <td>
        <a href="${app.resumeUrl}" target="_blank" class="btn btn-outline btn-sm" style="font-weight: 600;">
          📄 View Resume
        </a>
      </td>
      <td style="font-size: 13px; color: var(--text-muted);">${formatDate(app.appliedAt)}</td>
      <td>${getStatusBadge(app.status)}</td>
      <td>
        <button type="button" class="btn btn-primary btn-sm" onclick="openUpdateStatusModal('${app.id}')">
          Review & Status
        </button>
      </td>
    </tr>
  `).join('');
}

function filterApplicantsForJob(jobId) {
  document.querySelector('[data-tab=applicants]').click();
  const select = document.getElementById('filter-app-job-select');
  select.value = jobId;
  renderApplicantsTable();
}

async function loadCompanyProfile() {
  try {
    const res = await api.get('/recruiter/company');
    const comp = res.company;
    if (!comp) return;

    document.getElementById('comp-name').value = comp.name || '';
    document.getElementById('comp-website').value = comp.website || '';
    document.getElementById('comp-industry').value = comp.industry || '';
    document.getElementById('comp-size').value = comp.size || '';
    document.getElementById('comp-location').value = comp.location || '';
    document.getElementById('comp-desc').value = comp.description || '';

    const verifiedEl = document.getElementById('rec-stat-verified');
    if (comp.verified) {
      verifiedEl.textContent = 'Verified ✓';
      verifiedEl.style.color = '#10b981';
    } else {
      verifiedEl.textContent = 'Pending Admin Review';
      verifiedEl.style.color = '#f59e0b';
    }
  } catch (err) {
    console.warn('Could not load company profile:', err);
  }
}

// POST NEW JOB
async function handlePostJob(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-publish-job');

  const payload = {
    title: document.getElementById('job-title-input').value.trim(),
    category: document.getElementById('job-category-select').value,
    type: document.getElementById('job-type-select').value,
    location: document.getElementById('job-location-input').value.trim(),
    salary: document.getElementById('job-salary-input').value.trim(),
    experience: document.getElementById('job-exp-input').value.trim(),
    description: document.getElementById('job-desc-input').value.trim(),
    responsibilities: document.getElementById('job-resp-input').value.trim(),
    requirements: document.getElementById('job-req-input').value.trim(),
    benefits: document.getElementById('job-ben-input').value.trim()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Publishing job...';

  try {
    const res = await api.post('/jobs', payload);
    showToast(res.message || 'Job published successfully!', 'success');
    document.getElementById('post-job-form').reset();
    await loadJobs();
    document.querySelector('[data-tab=manage-jobs]').click();
  } catch (err) {
    showToast(err.message || 'Failed to post job.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Publish Job Opening';
  }
}

// EDIT JOB MODAL
function openEditJobModal(jobId) {
  const job = myJobs.find(j => j.id === jobId);
  if (!job) return;

  document.getElementById('edit-job-id').value = job.id;
  document.getElementById('edit-job-title').value = job.title;
  document.getElementById('edit-job-category').value = job.category || 'Engineering';
  document.getElementById('edit-job-type').value = job.type || 'Full-time';
  document.getElementById('edit-job-location').value = job.location || '';
  document.getElementById('edit-job-salary').value = job.salary || '';
  document.getElementById('edit-job-desc').value = job.description || '';
  document.getElementById('edit-job-status').value = job.status || 'active';

  openModal('edit-job-modal');
}

async function handleEditJobSubmit(e) {
  e.preventDefault();
  const jobId = document.getElementById('edit-job-id').value;
  const updates = {
    title: document.getElementById('edit-job-title').value.trim(),
    category: document.getElementById('edit-job-category').value,
    type: document.getElementById('edit-job-type').value,
    location: document.getElementById('edit-job-location').value.trim(),
    salary: document.getElementById('edit-job-salary').value.trim(),
    description: document.getElementById('edit-job-desc').value.trim(),
    status: document.getElementById('edit-job-status').value
  };

  try {
    const res = await api.put(`/jobs/${jobId}`, updates);
    showToast(res.message || 'Job updated successfully!', 'success');
    closeModal('edit-job-modal');
    await loadJobs();
  } catch (err) {
    showToast(err.message || 'Failed to update job.', 'error');
  }
}

// DELETE JOB
async function deleteJob(jobId) {
  if (!confirm('Are you sure you want to delete this job listing? All associated applications will also be removed.')) {
    return;
  }

  try {
    const res = await api.delete(`/jobs/${jobId}`);
    showToast(res.message || 'Job deleted successfully.', 'success');
    await loadJobs();
    await loadApplicants();
  } catch (err) {
    showToast(err.message || 'Failed to delete job.', 'error');
  }
}

// UPDATE APPLICANT STATUS MODAL
function openUpdateStatusModal(appId) {
  const app = allRecruiterApplicants.find(a => a.id === appId);
  if (!app) return;

  document.getElementById('status-app-id').value = app.id;
  document.getElementById('status-select').value = app.status;
  document.getElementById('status-notes').value = app.recruiterNotes || '';

  document.getElementById('applicant-detail-preview').innerHTML = `
    <div style="font-size: 16px; font-weight: 700; color: var(--secondary);">${escapeHtml(app.applicantName)}</div>
    <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">
      Applied for: <strong>${escapeHtml(app.jobTitle)}</strong> &bull; Applied: ${formatDate(app.appliedAt)}
    </div>
    <div style="margin-bottom: 10px;">
      <a href="${app.resumeUrl}" target="_blank" class="btn btn-outline btn-sm">📄 Download Applicant Resume</a>
    </div>
    ${app.coverNote ? `
      <div style="font-size: 13px; background: #fff; border: 1px solid var(--border); padding: 10px; border-radius: var(--radius-sm); color: var(--text-main);">
        <strong>Candidate Cover Note:</strong><br>${escapeHtml(app.coverNote)}
      </div>
    ` : ''}
  `;

  openModal('update-status-modal');
}

async function handleStatusSubmit(e) {
  e.preventDefault();
  const appId = document.getElementById('status-app-id').value;
  const status = document.getElementById('status-select').value;
  const notes = document.getElementById('status-notes').value.trim();
  const submitBtn = document.getElementById('btn-save-status');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const res = await api.put(`/applications/${appId}/status`, {
      status,
      recruiterNotes: notes
    });

    showToast(res.message || 'Status updated!', 'success');
    closeModal('update-status-modal');
    await loadApplicants();
  } catch (err) {
    showToast(err.message || 'Failed to update status.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Status Update';
  }
}

// UPDATE COMPANY PROFILE
async function handleCompanyUpdate(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('btn-save-company');

  const updates = {
    name: document.getElementById('comp-name').value.trim(),
    website: document.getElementById('comp-website').value.trim(),
    industry: document.getElementById('comp-industry').value.trim(),
    size: document.getElementById('comp-size').value.trim(),
    location: document.getElementById('comp-location').value.trim(),
    description: document.getElementById('comp-desc').value.trim()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const res = await api.put('/recruiter/company', updates);
    showToast(res.message || 'Company profile updated!', 'success');
    document.getElementById('recruiter-company').textContent = res.company.name;
  } catch (err) {
    showToast(err.message || 'Failed to update company.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Company Profile';
  }
}
