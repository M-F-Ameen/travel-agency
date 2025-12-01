// Admin bookings table management
document.addEventListener('DOMContentLoaded', function() {
    // Load config if not already loaded
    if (!window.Config) {
        console.error('Config module not loaded');
        return;
    }

    const bookingsTableBody = document.querySelector('#bookingsTable tbody');
    let currentPage = 1;
    let currentSearch = '';
    let currentStatusFilter = '';
    let currentSortBy = 'createdAt';
    let currentSortOrder = 'desc';
    let totalPages = 1;
    let totalBookings = 0;

    // Initialize controls
    if (bookingsTableBody) {
        initializeControls();
        loadBookings();
    }

    // Initialize search, filter, and pagination controls
    function initializeControls() {
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const sortBy = document.getElementById('sortBy');
        const sortOrder = document.getElementById('sortOrder');
        const refreshBtn = document.getElementById('refreshBtn');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');

        // Search functionality
        const performSearch = () => {
            currentSearch = searchInput.value.trim();
            currentPage = 1;
            loadBookings();
        };

        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });

        // Filter functionality
        statusFilter.addEventListener('change', () => {
            currentStatusFilter = statusFilter.value;
            currentPage = 1;
            loadBookings();
        });

        // Sorting functionality
        sortBy.addEventListener('change', () => {
            currentSortBy = sortBy.value;
            currentPage = 1;
            loadBookings();
        });

        sortOrder.addEventListener('change', () => {
            currentSortOrder = sortOrder.value;
            currentPage = 1;
            loadBookings();
        });

        // Refresh functionality
        refreshBtn.addEventListener('click', () => {
            loadBookings();
        });

        // Pagination functionality
        prevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadBookings();
            }
        });

        nextPage.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadBookings();
            }
        });
    }

    // Function to load bookings from the backend
    async function loadBookings() {
        try {
            const params = {
                page: currentPage,
                limit: Config.PAGINATION.DEFAULT_LIMIT,
                sortBy: currentSortBy,
                sortOrder: currentSortOrder
            };

            if (currentSearch) params.search = currentSearch;
            if (currentStatusFilter) params.status = currentStatusFilter;

            const response = await Config.api.getBookings(params);
            const result = await response.json();

            if (result.success) {
                displayBookings(result.data);
                updatePagination(result.pagination);
            } else {
                console.error('Failed to load bookings:', result.message);
                showNoBookingsMessage('Failed to load bookings. Please try again.');
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            showNoBookingsMessage('Network error: Unable to connect to server.');
        }
    }

    // Function to update pagination controls
    function updatePagination(pagination) {
        if (!pagination) return;

        currentPage = pagination.page;
        totalPages = pagination.pages;
        totalBookings = pagination.total;

        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPages').textContent = totalPages;
        document.getElementById('totalCount').textContent = totalBookings;
        document.getElementById('showingCount').textContent = totalBookings > 0 ?
            ((currentPage - 1) * Config.PAGINATION.DEFAULT_LIMIT) + 1 : 0;

        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
    }

    // Function to display bookings in the table
    function displayBookings(bookings) {
        bookingsTableBody.innerHTML = '';

        if (bookings.length === 0) {
            showNoBookingsMessage('No bookings found.');
            return;
        }

        bookings.forEach(booking => {
            const row = createBookingRow(booking);
            bookingsTableBody.appendChild(row);
        });
    }

    // Function to create a table row for a booking
    function createBookingRow(booking) {
        const row = document.createElement('tr');

        // Name and Booking ID
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `
            <div>
                <strong>${Config.utils.escapeHtml(booking.name)}</strong>
                <div style="font-size: 0.875rem; color: var(--gray-500);">
                    ID: #${booking._id.slice(-6).toUpperCase()}
                </div>
            </div>
        `;

        // Booking Date
        const dateCell = document.createElement('td');
        dateCell.textContent = Config.utils.formatDate(booking.travelDate);

        // Adults
        const adultsCell = document.createElement('td');
        adultsCell.innerHTML = `<strong>${booking.adults}</strong>`;

        // Children
        const childrenCell = document.createElement('td');
        childrenCell.innerHTML = `<strong>${booking.children || 0}</strong>`;

        // Email
        const emailCell = document.createElement('td');
        emailCell.textContent = Config.utils.escapeHtml(booking.email);

        // Phone
        const phoneCell = document.createElement('td');
        phoneCell.textContent = Config.utils.escapeHtml(booking.phone);

        // Status
        const statusCell = document.createElement('td');
        const statusBadgeClass = {
            'pending': 'badge-warning',
            'confirmed': 'badge-success',
            'cancelled': 'badge-danger'
        }[booking.status] || 'badge-secondary';

        const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
        statusCell.innerHTML = `
            <select class="status-select" data-booking-id="${booking._id}" onchange="updateBookingStatus('${booking._id}', this.value)">
                <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
        `;

        // Message (truncated)
        const messageCell = document.createElement('td');
        const truncatedMessage = booking.message ? booking.message.substring(0, 50) + (booking.message.length > 50 ? '...' : '') : '';
        messageCell.innerHTML = `
            <div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${Config.utils.escapeHtml(booking.message || 'No message')}">
                ${Config.utils.escapeHtml(truncatedMessage)}
            </div>
        `;

        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <div class="table-actions">
                <button class="btn btn-sm btn-secondary" onclick="viewBooking('${booking._id}')" title="View Details">
                    <span class="icon">👁</span>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteBooking('${booking._id}')" title="Delete Booking">
                    <span class="icon">🗑️</span>
                </button>
            </div>
        `;

        row.appendChild(nameCell);
        row.appendChild(dateCell);
        row.appendChild(adultsCell);
        row.appendChild(childrenCell);
        row.appendChild(emailCell);
        row.appendChild(phoneCell);
        row.appendChild(statusCell);
        row.appendChild(messageCell);
        row.appendChild(actionsCell);

        return row;
    }

    // Function to show empty state message
    function showNoBookingsMessage(message) {
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 1.1rem; margin-bottom: 10px;">📋</div>
                    <div>${message}</div>
                </td>
            </tr>
        `;
    }

});

// Global function to view booking details (can be expanded)
function viewBooking(bookingId) {
    alert(`View booking details for ID: ${bookingId}\n\nThis feature can be expanded to show a detailed modal with all booking information.`);
}

// Global function to update booking status
async function updateBookingStatus(bookingId, newStatus) {
    try {
        const response = await Config.api.updateBookingStatus(bookingId, newStatus);
        const result = await response.json();

        if (result.success) {
            Config.utils.showMessage(Config.MESSAGES.STATUS_UPDATE_SUCCESS, 'success');
            // Update the current search/filter to refresh the view
            if (window.location.reload) {
                setTimeout(() => location.reload(), 500); // Brief delay to show success message
            }
        } else {
            Config.utils.showMessage('Failed to update booking status: ' + result.message, 'error');
            // Reset the select back to previous value if update failed
            console.error('Status update failed, you may need to refresh the page');
        }
    } catch (error) {
        console.error('Error updating booking status:', error);
        Config.utils.showMessage('Network error: Unable to update booking status.', 'error');
    }
}

// Global function to delete booking
async function deleteBooking(bookingId) {
    if (confirm(Config.MESSAGES.BOOKING_DELETE_CONFIRM)) {
        try {
            const response = await Config.api.deleteBooking(bookingId);
            const result = await response.json();

            if (result.success) {
                Config.utils.showMessage(Config.MESSAGES.BOOKING_DELETE_SUCCESS, 'success');
                // Reload the page to refresh the bookings table
                location.reload();
            } else {
                Config.utils.showMessage('Failed to delete booking: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
            Config.utils.showMessage('Network error: Unable to delete booking.', 'error');
        }
    }
}
