/**
 * AUTH & NAVBAR MANAGER
 * Manages user session state, header rendering, and route protection.
 */

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  protectPage();
});

function renderNavbar() {
  const user = api.getUser();
  const navActions = document.getElementById('nav-actions');
  const navLinks = document.getElementById('nav-links');

  if (!navActions) return;

  if (user) {
    let dashboardUrl = '/seeker-dashboard.html';
    let roleLabel = 'Job Seeker';

    if (user.role === 'recruiter') {
      dashboardUrl = '/recruiter-dashboard.html';
      roleLabel = 'Recruiter';
    } else if (user.role === 'admin') {
      dashboardUrl = '/admin-dashboard.html';
      roleLabel = 'Admin';
    }

    // Role-specific nav links
    if (navLinks) {
      if (user.role === 'recruiter') {
        navLinks.innerHTML = `
          <li><a href="/jobs.html" class="nav-link">Explore Jobs</a></li>
          <li><a href="/recruiter-dashboard.html?tab=post-job" class="nav-link">Post a Job</a></li>
          <li><a href="/recruiter-dashboard.html?tab=manage-jobs" class="nav-link">My Jobs</a></li>
          <li><a href="/recruiter-dashboard.html?tab=applicants" class="nav-link">Applicants</a></li>
        `;
      } else if (user.role === 'admin') {
        navLinks.innerHTML = `
          <li><a href="/jobs.html" class="nav-link">Public Jobs</a></li>
          <li><a href="/admin-dashboard.html?tab=overview" class="nav-link">Admin Overview</a></li>
          <li><a href="/admin-dashboard.html?tab=users" class="nav-link">Users</a></li>
          <li><a href="/admin-dashboard.html?tab=fake-jobs" class="nav-link" style="color: #ef4444; font-weight:700;">Fake Jobs Queue</a></li>
        `;
      } else {
        // Seeker
        navLinks.innerHTML = `
          <li><a href="/jobs.html" class="nav-link">Find Jobs</a></li>
          <li><a href="/seeker-dashboard.html?tab=applications" class="nav-link">My Applications</a></li>
          <li><a href="/seeker-dashboard.html?tab=profile" class="nav-link">Resume & Profile</a></li>
        `;
      }
    }

    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

    navActions.innerHTML = `
      <a href="${dashboardUrl}" class="nav-user-badge">
        <div class="user-avatar-sm">${initials}</div>
        <div class="user-nav-meta">
          <span class="user-nav-name">${escapeHtml(user.name)}</span>
          <span class="user-nav-role">${roleLabel}</span>
        </div>
      </a>
      <a href="${dashboardUrl}" class="btn btn-outline btn-sm">Dashboard</a>
      <button onclick="handleLogout()" class="btn btn-outline btn-sm" title="Sign out">Log Out</button>
    `;
  } else {
    // Guest
    if (navLinks) {
      navLinks.innerHTML = `
        <li><a href="/index.html" class="nav-link">Home</a></li>
        <li><a href="/jobs.html" class="nav-link">Browse Jobs</a></li>
        <li><a href="/register.html?role=recruiter" class="nav-link">For Employers</a></li>
      `;
    }

    navActions.innerHTML = `
      <a href="/login.html" class="btn btn-outline btn-sm">Log In</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  }
}

function handleLogout() {
  if (confirm('Are you sure you want to log out?')) {
    api.logout();
  }
}

// Route Protection
function protectPage() {
  const path = window.location.pathname;
  const user = api.getUser();

  // If user visits login or register while already logged in, redirect them to dashboard
  if ((path.includes('login') || path.includes('register')) && user) {
    if (user.role === 'admin') window.location.href = '/admin-dashboard.html';
    else if (user.role === 'recruiter') window.location.href = '/recruiter-dashboard.html';
    else window.location.href = '/seeker-dashboard.html';
    return;
  }

  // Dashboard guards
  if (path.includes('seeker-dashboard') && (!user || user.role !== 'seeker')) {
    if (!user) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(path);
    } else {
      showToast('This dashboard is only for Job Seekers.', 'warning');
      window.location.href = user.role === 'admin' ? '/admin-dashboard.html' : '/recruiter-dashboard.html';
    }
  }

  if (path.includes('recruiter-dashboard') && (!user || user.role !== 'recruiter')) {
    if (!user) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(path);
    } else {
      showToast('This dashboard is only for Recruiters.', 'warning');
      window.location.href = user.role === 'admin' ? '/admin-dashboard.html' : '/seeker-dashboard.html';
    }
  }

  if (path.includes('admin-dashboard') && (!user || user.role !== 'admin')) {
    if (!user) {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(path);
    } else {
      showToast('Administrator privileges required.', 'error');
      window.location.href = user.role === 'recruiter' ? '/recruiter-dashboard.html' : '/seeker-dashboard.html';
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
