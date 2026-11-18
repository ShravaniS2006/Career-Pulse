/**
 * JOB DETAILS PAGE SCRIPT
 */

let currentJob = null;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('id');

  if (!jobId) {
    showToast('No job specified.', 'error');
    setTimeout(() => window.location.href = '/jobs.html', 1500);
    return;
  }

  await loadJobDetails(jobId);

  // Apply button
  document.getElementById('btn-apply-main').addEventListener('click', () => {
    triggerApplyModal();
  });

  // Report button
  document.getElementById('btn-report-job').addEventListener('click', () => {
    openModal('report-modal');
  });

  // Apply form
  document.getElementById('apply-job-form').addEventListener('submit', handleApplySubmit);

  // Report form
  document.getElementById('report-job-form').addEventListener('submit', handleReportSubmit);
});

async function loadJobDetails(id) {
  try {
    const data = await api.get(`/jobs/${id}`);
    const job = data.job;
    const company = data.company;
    currentJob = job;

    document.title = `${job.title} | CareerPulse`;

    const initials = job.companyName ? job.companyName.substring(0, 2).toUpperCase() : 'CO';
    document.getElementById('company-logo-large').textContent = initials;
    document.getElementById('detail-company-name').textContent = job.companyName;
    document.getElementById('detail-job-title').textContent = job.title;
    document.getElementById('detail-job-location').textContent = `📍 ${job.location || 'Remote'}`;
    document.getElementById('detail-job-type').textContent = `💼 ${job.type || 'Full-time'}`;
    document.getElementById('detail-job-salary').textContent = `💰 ${job.salary || 'Competitive'}`;
    document.getElementById('detail-job-exp').textContent = `⭐ ${job.experience || 'Experienced'}`;
    document.getElementById('detail-posted-date').textContent = formatDate(job.createdAt);
    document.getElementById('detail-job-description').textContent = job.description;

    if (company && company.verified) {
      document.getElementById('company-verified-tag').style.display = 'inline-flex';
    }

    // Responsibilities
    const respList = document.getElementById('detail-responsibilities-list');
    if (job.responsibilities && job.responsibilities.length > 0) {
      respList.innerHTML = job.responsibilities.map(r => `<li>${escapeHtml(r)}</li>`).join('');
    } else {
      document.getElementById('responsibilities-section').style.display = 'none';
    }

    // Requirements
    const reqList = document.getElementById('detail-requirements-list');
    if (job.requirements && job.requirements.length > 0) {
      reqList.innerHTML = job.requirements.map(r => `<li>${escapeHtml(r)}</li>`).join('');
    } else {
      document.getElementById('requirements-section').style.display = 'none';
    }

    // Benefits
    const benList = document.getElementById('detail-benefits-list');
    if (job.benefits && job.benefits.length > 0) {
      benList.innerHTML = job.benefits.map(b => `<li>${escapeHtml(b)}</li>`).join('');
    } else {
      document.getElementById('benefits-section').style.display = 'none';
    }

    // Company Sidebar
    document.getElementById('side-company-name').textContent = job.companyName;
    if (company) {
      document.getElementById('side-company-desc').textContent = company.description || 'Leading innovation in its sector.';
      document.getElementById('side-company-industry').textContent = company.industry || 'Technology';
      document.getElementById('side-company-size').textContent = company.size || '50-200 employees';
      document.getElementById('side-company-loc').textContent = company.location || job.location || 'Global';
      if (company.website) {
        const webEl = document.getElementById('side-company-web');
        webEl.href = company.website;
        webEl.textContent = company.website;
      }
    } else {
      document.getElementById('side-company-desc').textContent = 'Reliable verified employer on CareerPulse.';
    }

  } catch (err) {
    showToast('Failed to load job details.', 'error');
  }
}

function triggerApplyModal() {
  const user = api.getUser();
  if (!user) {
    showToast('Please log in as a Job Seeker to apply.', 'warning');
    setTimeout(() => {
      window.location.href = `/login.html?redirect=/job-details.html?id=${currentJob.id}`;
    }, 1200);
    return;
  }

  if (user.role !== 'seeker') {
    showToast('Only Job Seekers can submit applications.', 'error');
    return;
  }

  document.getElementById('apply-job-id').value = currentJob.id;
  document.getElementById('apply-modal-title').textContent = `Apply for: ${currentJob.title}`;
  document.getElementById('apply-job-meta').innerHTML = `
    <strong>${escapeHtml(currentJob.title)}</strong> at <strong>${escapeHtml(currentJob.companyName)}</strong><br>
    <span style="font-size: 13px;">📍 ${escapeHtml(currentJob.location)} &bull; 💰 ${escapeHtml(currentJob.salary)}</span>
  `;

  const resumeHint = document.getElementById('resume-status-hint');
  const fileInput = document.getElementById('apply-resume-file');

  if (user.resumeUrl) {
    resumeHint.innerHTML = `📄 Resume on file: <a href="${user.resumeUrl}" target="_blank" style="font-weight: 700; text-decoration: underline;">${escapeHtml(user.resumeName || 'View Current Resume')}</a>. (Upload a new file below if you wish to update).`;
    fileInput.required = false;
  } else {
    resumeHint.innerHTML = `<span style="color: #b91c1c; font-weight: 600;">⚠️ No resume uploaded yet. Please upload your resume (PDF/DOC/TXT) below.</span>`;
    fileInput.required = true;
  }

  openModal('apply-modal');
}

async function handleApplySubmit(e) {
  e.preventDefault();
  const coverNote = document.getElementById('apply-cover-note').value.trim();
  const fileInput = document.getElementById('apply-resume-file');
  const submitBtn = document.getElementById('btn-submit-app');

  const formData = new FormData();
  formData.append('jobId', currentJob.id);
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

async function handleReportSubmit(e) {
  e.preventDefault();
  const reasonSelect = document.getElementById('report-reason-select').value;
  const details = document.getElementById('report-details').value.trim();
  const fullReason = details ? `${reasonSelect} - ${details}` : reasonSelect;

  try {
    const res = await api.post(`/jobs/${currentJob.id}/report`, { reason: fullReason });
    showToast(res.message || 'Report submitted to Admin.', 'success');
    closeModal('report-modal');
  } catch (err) {
    showToast(err.message || 'Failed to report job.', 'error');
  }
}
