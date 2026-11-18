/**
 * JOBS BROWSING & SEARCH SCRIPT
 * Live filtering, sorting, applying with resume, and reporting fake jobs.
 */

let allLoadedJobs = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Sync form inputs with URL parameters
  const params = new URLSearchParams(window.location.search);
  if (params.get('q')) document.getElementById('filter-q').value = params.get('q');
  if (params.get('category')) document.getElementById('filter-category').value = params.get('category');
  if (params.get('location')) document.getElementById('filter-location').value = params.get('location');

  await fetchAndRenderJobs();

  // Filter form submit
  document.getElementById('jobs-filter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    fetchAndRenderJobs();
  });

  // Reset button
  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    document.getElementById('filter-q').value = '';
    document.getElementById('filter-category').value = 'All';
    document.getElementById('filter-type').value = 'All';
    document.getElementById('filter-location').value = '';
    fetchAndRenderJobs();
  });

  // Sort dropdown
  document.getElementById('sort-jobs').addEventListener('change', () => {
    sortAndRender();
  });

  // Apply Form Submit
  document.getElementById('apply-job-form').addEventListener('submit', handleApplySubmit);

  // Report Form Submit
  document.getElementById('report-job-form').addEventListener('submit', handleReportSubmit);
});

async function fetchAndRenderJobs() {
  const container = document.getElementById('jobs-container');
  const countSpan = document.getElementById('jobs-count');

  const q = document.getElementById('filter-q').value.trim();
  const category = document.getElementById('filter-category').value;
  const type = document.getElementById('filter-type').value;
  const location = document.getElementById('filter-location').value.trim();

  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (category && category !== 'All') queryParams.set('category', category);
  if (type && type !== 'All') queryParams.set('type', type);
  if (location) queryParams.set('location', location);

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
      Searching available positions...
    </div>
  `;

  try {
    const res = await api.get(`/jobs?${queryParams.toString()}`);
    allLoadedJobs = res.jobs || [];
    countSpan.textContent = allLoadedJobs.length;
    sortAndRender();
  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ef4444;">
        Failed to fetch jobs. ${escapeHtml(err.message)}
      </div>
    `;
  }
}

function sortAndRender() {
  const container = document.getElementById('jobs-container');
  const sort = document.getElementById('sort-jobs').value;

  let list = [...allLoadedJobs];

  if (sort === 'title') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // Newest first
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
        <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 18px; color: var(--secondary); margin-bottom: 6px;">No jobs match your criteria</h3>
        <p style="color: var(--text-muted); font-size: 14px; max-width: 400px; margin: 0 auto 16px;">Try adjusting your keyword, removing category filters, or searching for 'Remote'.</p>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('btn-reset-filters').click()">Clear All Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(renderJobItem).join('');
}

function renderJobItem(job) {
  const initials = job.companyName ? job.companyName.substring(0, 2).toUpperCase() : 'CO';
  const user = api.getUser();
  const isSeeker = user && user.role === 'seeker';

  return `
    <div class="job-card ${job.isFeatured ? 'featured' : ''}">
      <div class="job-card-header">
        <div class="job-company-info">
          <div class="company-logo">${initials}</div>
          <div>
            <div class="job-company-name">
              ${escapeHtml(job.companyName)}
              <span class="verified-icon" title="Verified Employer">✓</span>
            </div>
            <h3 class="job-title">${escapeHtml(job.title)}</h3>
          </div>
        </div>
        ${job.isFeatured ? '<span class="badge badge-primary">Featured</span>' : ''}
      </div>

      <div class="job-meta-row">
        <span class="job-meta-item">📍 ${escapeHtml(job.location || 'Remote')}</span>
        <span class="job-meta-item">💼 ${escapeHtml(job.type || 'Full-time')}</span>
        <span class="job-meta-item">⭐ ${escapeHtml(job.experience || 'Mid-Level')}</span>
      </div>

      <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 14px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        ${escapeHtml(job.description)}
      </p>

      <div class="job-tags">
        <span class="badge badge-gray">${escapeHtml(job.category)}</span>
        <span class="badge badge-gray">Posted ${formatDate(job.createdAt)}</span>
      </div>

      <div class="job-card-footer">
        <div class="job-salary">${escapeHtml(job.salary || 'Competitive')}</div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openReportModal('${job.id}')" title="Report fake job" style="padding: 6px 10px;">
            ⚠️
          </button>
          <a href="/job-details.html?id=${job.id}" class="btn btn-outline-primary btn-sm">Details</a>
          <button type="button" class="btn btn-primary btn-sm" onclick="triggerApplyModal('${job.id}')">Apply</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Apply Modal Handler
 */
function triggerApplyModal(jobId) {
  const user = api.getUser();
  if (!user) {
    showToast('Please log in as a Job Seeker to apply.', 'warning');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=/jobs.html`;
    }, 1200);
    return;
  }

  if (user.role !== 'seeker') {
    showToast('Only Job Seekers can apply for jobs.', 'error');
    return;
  }

  const job = allLoadedJobs.find(j => j.id === jobId);
  if (!job) return;

  document.getElementById('apply-job-id').value = job.id;
  document.getElementById('apply-modal-title').textContent = `Apply for: ${job.title}`;
  document.getElementById('apply-job-meta').innerHTML = `
    <strong>${escapeHtml(job.title)}</strong> at <strong>${escapeHtml(job.companyName)}</strong><br>
    <span style="font-size: 13px;">📍 ${escapeHtml(job.location)} &bull; 💰 ${escapeHtml(job.salary)}</span>
  `;

  const resumeHint = document.getElementById('resume-status-hint');
  const fileInput = document.getElementById('apply-resume-file');

  if (user.resumeUrl) {
    resumeHint.innerHTML = `📄 Default Resume on file: <a href="${user.resumeUrl}" target="_blank" style="font-weight: 700; text-decoration: underline;">${escapeHtml(user.resumeName || 'View Current Resume')}</a>. (Upload a new file below if you want to replace it for this application).`;
    fileInput.required = false;
  } else {
    resumeHint.innerHTML = `<span style="color: #b91c1c; font-weight: 600;">⚠️ No resume on file yet. Please upload your resume (PDF/DOC/TXT) below.</span>`;
    fileInput.required = true;
  }

  openModal('apply-modal');
}

async function handleApplySubmit(e) {
  e.preventDefault();
  const jobId = document.getElementById('apply-job-id').value;
  const coverNote = document.getElementById('apply-cover-note').value.trim();
  const fileInput = document.getElementById('apply-resume-file');
  const submitBtn = document.getElementById('btn-submit-app');

  const formData = new FormData();
  formData.append('jobId', jobId);
  formData.append('coverNote', coverNote);

  if (fileInput.files && fileInput.files[0]) {
    formData.append('resume', fileInput.files[0]);
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const res = await api.upload('/applications', formData);
    showToast(res.message || 'Application submitted successfully!', 'success');
    closeModal('apply-modal');
    document.getElementById('apply-job-form').reset();
  } catch (err) {
    showToast(err.message || 'Failed to submit application.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Application';
  }
}

/**
 * Report Fake Job Handler
 */
function openReportModal(jobId) {
  document.getElementById('report-job-id').value = jobId;
  document.getElementById('report-job-form').reset();
  openModal('report-modal');
}

async function handleReportSubmit(e) {
  e.preventDefault();
  const jobId = document.getElementById('report-job-id').value;
  const reasonSelect = document.getElementById('report-reason-select').value;
  const details = document.getElementById('report-details').value.trim();

  const fullReason = details ? `${reasonSelect} - ${details}` : reasonSelect;

  try {
    const res = await api.post(`/jobs/${jobId}/report`, { reason: fullReason });
    showToast(res.message || 'Report submitted to Admin.', 'success');
    closeModal('report-modal');
  } catch (err) {
    showToast(err.message || 'Failed to submit report.', 'error');
  }
}
