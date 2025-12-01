// Configuration module for API endpoints and settings
const config = {
  // API Configuration
  API_BASE_URL: 'http://localhost:50001',
  API_ENDPOINTS: {
    BOOKINGS: '/api/bookings',
    TOURS: '/api/tours',
    HEALTH: '/health'
  },

  // Booking status options
  BOOKING_STATUSES: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled'
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100
  },

  // UI Messages
  MESSAGES: {
    LOADING: 'Loading...',
    ERROR_NETWORK: 'Network error: Unable to connect to server.',
    ERROR_UNKNOWN: 'An unexpected error occurred.',
    BOOKING_SUCCESS: 'Booking submitted successfully!',
    BOOKING_DELETE_CONFIRM: 'Are you sure you want to delete this booking? This action cannot be undone.',
    BOOKING_DELETE_SUCCESS: 'Booking deleted successfully!',
    STATUS_UPDATE_SUCCESS: 'Booking status updated successfully!'
  }
};

// API client helper functions
config.api = {
  getBookings: (params = {}) => {
    const url = new URL(config.API_BASE_URL + config.API_ENDPOINTS.BOOKINGS);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  },

  createBooking: (data) => {
    return fetch(config.API_BASE_URL + config.API_ENDPOINTS.BOOKINGS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
  },

  updateBookingStatus: (id, status) => {
    return fetch(`${config.API_BASE_URL + config.API_ENDPOINTS.BOOKINGS}/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });
  },

    deleteBooking: (id) => {
      return fetch(`${config.API_BASE_URL + config.API_ENDPOINTS.BOOKINGS}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    },

    // Tour endpoints
    getTours: (params = {}) => {
      const url = new URL(config.API_BASE_URL + config.API_ENDPOINTS.TOURS);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      return fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    },

    getTour: (id) => {
      return fetch(config.API_BASE_URL + config.API_ENDPOINTS.TOURS + '/' + id, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    },

    createTour: (formData) => {
      return fetch(config.API_BASE_URL + config.API_ENDPOINTS.TOURS, {
        method: 'POST',
        body: formData // FormData for file uploads
      });
    },

    updateTour: (id, formData) => {
      return fetch(`${config.API_BASE_URL + config.API_ENDPOINTS.TOURS}/${id}`, {
        method: 'PUT',
        body: formData
      });
    },

    updateTourStatus: (id, isActive) => {
      return fetch(`${config.API_BASE_URL + config.API_ENDPOINTS.TOURS}/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive })
      });
    },

    deleteTour: (id) => {
      return fetch(`${config.API_BASE_URL + config.API_ENDPOINTS.TOURS}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    },

    getAdminTours: (params = {}) => {
      const url = new URL(config.API_BASE_URL + '/api/admin/tours');
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      return fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
};

// Utility functions
config.utils = {
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  escapeHtml: (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  showMessage: (message, type = 'info') => {
    // Create a temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type}`;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 400px;
    `;

    // Set background color based on type
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    messageEl.style.backgroundColor = colors[type] || colors.info;

    messageEl.textContent = message;
    document.body.appendChild(messageEl);

    // Remove after 5 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    }, 5000);

    // Allow clicking to dismiss
    messageEl.addEventListener('click', () => {
      if (messageEl.parentNode) {
        messageEl.remove();
      }
    });
  }
};

window.Config = config;
