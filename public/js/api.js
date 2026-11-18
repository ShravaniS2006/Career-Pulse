/**
 * API & UTILITY CLIENT
 * Handles requests, token auth headers, toasts, and helpers.
 */

const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('jobportal_token') || '';
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('jobportal_token', token);
    } else {
      localStorage.removeItem('jobportal_token');
    }
  },

  getUser() {
    try {
      const u = localStorage.getItem('jobportal_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('jobportal_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('jobportal_user');
    }
  },

  logout() {
    this.setToken(null);
    this.setUser(null);
    window.location.href = '/login.html';
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = options.headers || {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({ success: false, message: 'Server returned an invalid response.' }));

      if (!res.ok) {
        // If 401 Unauthorized, and not already on login page
        if (res.status === 401 && !window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
          this.setToken(null);
          this.setUser(null);
          // Only redirect if protected page
          if (window.location.pathname.includes('dashboard')) {
            window.location.href = '/login.html';
          }
        }
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  },

  delete(endpoint, body) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined
    });
  },

  upload(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData
    });
  }
};

/**
 * Toast Notification System
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '📢'}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Modal Manager
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Global modal close on backdrop click or close button
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (e.target.closest('[data-modal-close]')) {
    const backdrop = e.target.closest('.modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
});

/**
 * Format Helpers
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusBadge(status) {
  const map = {
    'Applied': 'badge-primary',
    'Under Review': 'badge-warning',
    'Reviewing': 'badge-warning',
    'Shortlisted': 'badge-purple',
    'Interviewing': 'badge-primary',
    'Hired': 'badge-success',
    'Accepted': 'badge-success',
    'Rejected': 'badge-danger',
    'active': 'badge-success',
    'closed': 'badge-gray',
    'flagged': 'badge-danger',
    'suspended': 'badge-danger'
  };
  const cls = map[status] || 'badge-gray';
  return `<span class="badge ${cls}">${status}</span>`;
}
