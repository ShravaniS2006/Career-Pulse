/**
 * MAIN / HOMEPAGE SCRIPT
 * Loads featured jobs, updates stats, handles hero search form
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadFeaturedJobs();
});

async function loadFeaturedJobs() {
  const grid = document.getElementById('featured-jobs-grid');
  if (!grid) return;

  try {
    const data = await api.get('/jobs?featured=true');
    let jobs = data.jobs || [];

    // If fewer than 3 featured jobs, fetch all and pick top active
    if (jobs.length < 3) {
      const allData = await api.get('/jobs');
      jobs = allData.jobs || [];
    }

    if (jobs.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          No active job posts found at this time.
        </div>
      `;
      return;
    }

    grid.innerHTML = jobs.slice(0, 6).map(renderJobCard).join('');
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ef4444;">
        Unable to load jobs. Please ensure the server is running.
      </div>
    `;
  }
}

function renderJobCard(job) {
  const companyInitials = job.companyName ? job.companyName.substring(0, 2).toUpperCase() : 'CO';
  
  return `
    <div class="job-card ${job.isFeatured ? 'featured' : ''}">
      <div class="job-card-header">
        <div class="job-company-info">
          <div class="company-logo">${companyInitials}</div>
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

      <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        ${escapeHtml(job.description)}
      </p>

      <div class="job-tags">
        <span class="badge badge-gray">${escapeHtml(job.category)}</span>
        ${(job.requirements || []).slice(0, 2).map(req => `<span class="badge badge-gray">${escapeHtml(req.substring(0, 24))}...</span>`).join('')}
      </div>

      <div class="job-card-footer">
        <div class="job-salary">${escapeHtml(job.salary || 'Competitive')}</div>
        <a href="/job-details.html?id=${job.id}" class="btn btn-outline-primary btn-sm">View Details &rarr;</a>
      </div>
    </div>
  `;
}
