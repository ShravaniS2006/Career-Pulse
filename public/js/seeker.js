/**
 * JOB SEEKER DASHBOARD LOGIC
 */

let myApplications = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  await loadSeekerData();

  // Resume upload form
  document.getElementById('upload-resume-form').addEventListener('submit', handleResumeUpload);

  // Profile form
  document.getElementById('seeker-profile-form').addEventListener('submit', handleProfileUpdate);
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

  // Handle URL hash or param
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab) {
    const btn = document.querySelector(`.sidebar-link[data-tab="${tab}"]`);
    if (btn) btn.click();
  }
}

async function loadSeekerData() {
  const user = api.getUser();
  if (!user) return;

  // Header and Profile sidebar
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
  document.getElementById('seeker-avatar').textContent = initials;
  document.getElementById('seeker-name').textContent = user.name;
  document.getElementById('seeker-headline').textContent = user.title || 'Job Seeker';

  // Fill Profile Inputs
  document.getElementById('prof-name').value = user.name || '';
  document.getElementById('prof-phone').value = user.phone || '';
  document.getElementById('prof-email').value = user.email || '';
  document.getElementById('prof-title').value = user.title || '';
  document.getElementById('prof-skills').value = Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || '');
  document.getElementById('prof-bio').value = user.bio || '';

  // Resume Display
  updateResumeDisplay(user.resumeUrl, user.resumeName);

  // Fetch Applications
  await loadApplications();
}

function updateResumeDisplay(url, name) {
  const nameLabel = document.getElementById('label-resume-name');
  const statusLabel = document.getElementById('label-resume-status');
  const actionsGroup = document.getElementById('resume-actions-group');
  const downloadBtn = document.getElementById('btn-download-resume');

  if (url) {
    nameLabel.textContent = name || 'Uploaded Resume';
    statusLabel.innerHTML = `Active resume file ready for recruiter review. <span style="color: #059669; font-weight:700;">✓ Verified</span>`;
    downloadBtn.href = url;
    actionsGroup.style.display = 'block';
  } else {
    nameLabel.textContent = 'No Resume Uploaded';
    statusLabel.textContent = 'Upload your PDF or Word document to apply in 1-click.';
    actionsGroup.style.display = 'none';
  }
}

async function loadApplications() {
  const container = document.getElementById('applications-list-container');
  try {
    const res = await api.get('/applications/my');
    myApplications = res.applications || [];

    // Update Counts & Badges
    document.getElementById('badge-app-count').textContent = myApplications.length;
    document.getElementById('seeker-stat-total').textContent = myApplications.length;

    const reviewing = myApplications.filter(a => a.status === 'Under Review' || a.status === 'Reviewing' || a.status === 'Applied').length;
    const interviews = myApplications.filter(a => a.status === 'Shortlisted' || a.status === 'Interviewing').length;
    const hired = myApplications.filter(a => a.status === 'Hired' || a.status === 'Accepted').length;

    document.getElementById('seeker-stat-review').textContent = reviewing;
    document.getElementById('seeker-stat-interviews').textContent = interviews;
    document.getElementById('seeker-stat-hired').textContent = hired;

    if (myApplications.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3 class="empty-state-title">No Applications Submitted Yet</h3>
          <p class="empty-state-desc">You have not applied for any jobs yet. Browse thousands of verified openings and take the next step in your career.</p>
          <a href="/jobs.html" class="btn btn-primary">Find Jobs Now</a>
        </div>
      `;
      return;
    }

    container.innerHTML = myApplications.map(renderApplicationCard).join('');
  } catch (err) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ef4444;">
        Failed to load applications: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

function renderApplicationCard(app) {
  const isRejected = app.status === 'Rejected';
  const isShortlisted = ['Shortlisted', 'Interviewing', 'Hired', 'Accepted'].includes(app.status);
  const isHired = ['Hired', 'Accepted'].includes(app.status);
  const isReviewing = ['Under Review', 'Reviewing', 'Shortlisted', 'Interviewing', 'Hired', 'Accepted'].includes(app.status);

  return `
    <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; margin-bottom: 20px; box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
        <div>
          <div style="font-size: 13px; font-weight: 700; color: var(--text-muted);">${escapeHtml(app.companyName)}</div>
          <h3 style="font-size: 18px; font-weight: 700; color: var(--secondary); margin-top: 2px;">
            ${escapeHtml(app.jobTitle)}
          </h3>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
            Applied on ${formatDate(app.appliedAt)} &bull; Application ID: <code>${escapeHtml(app.id)}</code>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          ${getStatusBadge(app.status)}
          <button type="button" class="btn btn-outline btn-sm" onclick="withdrawApplication('${app.id}')" style="color: #ef4444; border-color: #fecaca;">
            Withdraw
          </button>
        </div>
      </div>

      <!-- Cover Note & Resume Submitted -->
      <div style="background: #f8fafc; border-radius: var(--radius-sm); padding: 12px 16px; margin: 12px 0; font-size: 13px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <span style="font-weight: 600; color: var(--text-main);">Submitted CV:</span> 
          <a href="${app.resumeUrl}" target="_blank" style="font-weight: 700; text-decoration: underline;">
            ${escapeHtml(app.resumeName || 'View Uploaded Resume')}
          </a>
        </div>
        ${app.coverNote ? `<div style="color: var(--text-muted); font-style: italic; max-width: 500px;">"${escapeHtml(app.coverNote.substring(0, 100))}${app.coverNote.length > 100 ? '...' : ''}"</div>` : ''}
      </div>

      <!-- Recruiter Feedback / Notes -->
      ${app.recruiterNotes ? `
        <div style="margin: 10px 0; padding: 10px 14px; background: #eff6ff; border-left: 3px solid var(--primary); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: 13px;">
          <strong style="color: #1e40af;">Recruiter Update:</strong> 
          <span style="color: #1e3a8a;">${escapeHtml(app.recruiterNotes)}</span>
        </div>
      ` : ''}

      <!-- Visual Progress Tracker -->
      <div class="status-tracker">
        <!-- Step 1: Applied -->
        <div class="tracker-step completed">
          <div class="tracker-dot"></div>
          <span>Applied</span>
        </div>
        <div class="tracker-line ${isReviewing ? 'active' : ''}"></div>

        <!-- Step 2: Under Review -->
        <div class="tracker-step ${isReviewing ? (app.status === 'Applied' ? 'current' : 'completed') : ''}">
          <div class="tracker-dot"></div>
          <span>Under Review</span>
        </div>
        <div class="tracker-line ${isShortlisted ? 'active' : ''}"></div>

        <!-- Step 3: Shortlisted / Interviewing -->
        <div class="tracker-step ${isShortlisted ? (isHired ? 'completed' : 'current') : ''}">
          <div class="tracker-dot"></div>
          <span>Shortlisted / Interview</span>
        </div>
        <div class="tracker-line ${isHired || isRejected ? 'active' : ''}"></div>

        <!-- Step 4: Decision (Hired or Rejected) -->
        ${isRejected ? `
          <div class="tracker-step rejected">
            <div class="tracker-dot"></div>
            <span>Rejected</span>
          </div>
        ` : `
          <div class="tracker-step ${isHired ? 'completed' : ''}">
            <div class="tracker-dot"></div>
            <span>${isHired ? 'Hired 🎉' : 'Final Decision'}</span>
          </div>
        `}
      </div>
    </div>
  `;
}

async function withdrawApplication(appId) {
  if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
    return;
  }

  try {
    const res = await api.delete(`/applications/${appId}`);
    showToast(res.message || 'Application withdrawn.', 'success');
    await loadApplications();
  } catch (err) {
    showToast(err.message || 'Failed to withdraw application.', 'error');
  }
}

async function handleResumeUpload(e) {
  e.preventDefault();
  const fileInput = document.getElementById('input-resume-file');
  const submitBtn = document.getElementById('btn-upload-submit');

  if (!fileInput.files || !fileInput.files[0]) {
    showToast('Please select a file to upload.', 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('resume', fileInput.files[0]);

  submitBtn.disabled = true;
  submitBtn.textContent = 'Uploading...';

  try {
    const res = await api.upload('/auth/upload-resume', formData);
    showToast('Resume uploaded and attached to your profile!', 'success');

    // Update local user state
    const user = api.getUser();
    user.resumeUrl = res.resumeUrl;
    user.resumeName = res.resumeName;
    api.setUser(user);

    updateResumeDisplay(res.resumeUrl, res.resumeName);
    fileInput.value = '';
  } catch (err) {
    showToast(err.message || 'Failed to upload resume.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Upload & Save Resume';
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const name = document.getElementById('prof-name').value.trim();
  const phone = document.getElementById('prof-phone').value.trim();
  const title = document.getElementById('prof-title').value.trim();
  const skills = document.getElementById('prof-skills').value.trim();
  const bio = document.getElementById('prof-bio').value.trim();
  const submitBtn = document.getElementById('btn-save-profile');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const res = await api.put('/auth/profile', { name, phone, title, skills, bio });
    showToast('Profile updated successfully!', 'success');
    api.setUser(res.user);

    document.getElementById('seeker-name').textContent = res.user.name;
    document.getElementById('seeker-headline').textContent = res.user.title || 'Job Seeker';
  } catch (err) {
    showToast(err.message || 'Failed to update profile.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Changes';
  }
}
