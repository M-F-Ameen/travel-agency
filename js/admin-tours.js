// Admin tours table and form management
document.addEventListener('DOMContentLoaded', function() {
    // Load config if not already loaded
    if (!window.Config) {
        console.error('Config module not loaded');
        return;
    }

    const addTourForm = document.getElementById('addForm');
    const toursTableBody = document.querySelector('#itemsTable tbody');

    // Initialize admin tours functionality
    if (addTourForm) {
        initializeTourForm(addTourForm);
    }

    if (toursTableBody) {
        loadAdminTours();
    }
});

// Initialize the tour creation form
function initializeTourForm(form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<span>Creating...</span>';

        try {
            // Get form data with file
            const formData = new FormData(form);

            // Submit to API
            const response = await Config.api.createTour(formData);
            const result = await response.json();

            if (result.success) {
                Config.utils.showMessage('Tour created successfully!', 'success');

                // Reset form
                form.reset();

                // Refresh tours table
                if (window.loadAdminTours) {
                    loadAdminTours();
                }
            } else {
                // Show validation errors
                let errorMessage = result.message || 'Failed to create tour';
                if (result.errors) {
                    errorMessage = result.errors.map(err => err.msg).join('\n');
                }
                Config.utils.showMessage('Tour creation failed: ' + errorMessage, 'error');
            }
        } catch (error) {
            console.error('Tour creation error:', error);
            Config.utils.showMessage('Network error: Unable to create tour.', 'error');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    });
}

// Function to load tours for admin table
async function loadAdminTours() {
    const toursTableBody = document.querySelector('#itemsTable tbody');

    if (!toursTableBody) return;

    try {
        // Show loading
        toursTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div>Loading tours...</div>
                </td>
            </tr>
        `;

        const response = await Config.api.getAdminTours();
        const result = await response.json();

        if (result.success) {
            displayAdminTours(result.data);
        } else {
            console.error('Failed to load tours:', result.message);
            toursTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #dc3545;">
                        <div>Failed to load tours</div>
                        <div style="font-size: 0.875rem; margin-top: 5px;">${result.message || 'Please try again'}</div>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading tours:', error);
        toursTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #dc3545;">
                    <div>Network error: Unable to load tours</div>
                    <div style="font-size: 0.875rem; margin-top: 5px;">Please check your connection</div>
                </td>
            </tr>
        `;
    }
}

// Function to display tours in admin table
function displayAdminTours(tours) {
    const toursTableBody = document.querySelector('#itemsTable tbody');

    if (tours.length === 0) {
        toursTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 1.1rem; margin-bottom: 10px;">🏖️</div>
                    <div>No tours found</div>
                    <div style="font-size: 0.875rem; margin-top: 5px;">Create your first tour to get started</div>
                </td>
            </tr>
        `;
        return;
    }

    toursTableBody.innerHTML = '';

    tours.forEach(tour => {
        const row = document.createElement('tr');

        // Image
        const imageCell = document.createElement('td');
        imageCell.innerHTML = `
            <img src="${tour.imageUrl}" alt="${Config.utils.escapeHtml(tour.title)}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">
        `;

        // Title & Description
        const titleCell = document.createElement('td');
        titleCell.innerHTML = `
            <div>
                <strong>${Config.utils.escapeHtml(tour.title)}</strong>
                <div style="font-size: 0.75rem; color: var(--gray-500); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${Config.utils.escapeHtml(tour.description)}">
                    ${Config.utils.escapeHtml(tour.description.substring(0, 60))}${tour.description.length > 60 ? '...' : ''}
                </div>
            </div>
        `;

        // Category
        const categoryCell = document.createElement('td');
        const categoryColors = {
            adventure: '#e67e22',
            cultural: '#9b59b6',
            luxury: '#e74c3c',
            family: '#27ae60',
            romantic: '#e91e63'
        };
        categoryCell.innerHTML = `
            <span style="background: ${categoryColors[tour.category] || '#95a5a6'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; text-transform: capitalize;">
                ${tour.category}
            </span>
        `;

        // Duration
        const durationCell = document.createElement('td');
        durationCell.textContent = tour.duration;

        // Price
        const priceCell = document.createElement('td');
        priceCell.innerHTML = `<strong>$${tour.price.toLocaleString()}</strong>`;

        // Status
        const statusCell = document.createElement('td');
        const statusIcon = tour.isActive ? '✅' : '❌';
        const statusText = tour.isActive ? 'Active' : 'Inactive';
        const statusColor = tour.isActive ? '#27ae60' : '#e74c3c';
        statusCell.innerHTML = `
            <span style="color: ${statusColor}; font-weight: 500;">
                ${statusIcon} ${statusText}
            </span>
        `;

        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.innerHTML = `
            <div class="table-actions">
                <button class="btn btn-sm btn-secondary" onclick="toggleTourStatus('${tour._id}', ${!tour.isActive})" title="${tour.isActive ? 'Deactivate' : 'Activate'} Tour">
                    <span class="icon">${tour.isActive ? '🔽' : '🔼'}</span>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTour('${tour._id}')" title="Delete Tour">
                    <span class="icon">🗑️</span>
                </button>
            </div>
        `;

        row.appendChild(imageCell);
        row.appendChild(titleCell);
        row.appendChild(categoryCell);
        row.appendChild(durationCell);
        row.appendChild(priceCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);

        toursTableBody.appendChild(row);
    });
}

// Global function to toggle tour status
async function toggleTourStatus(tourId, isActive) {
    const confirmMessage = isActive ?
        'Are you sure you want to activate this tour? It will be visible to customers.' :
        'Are you sure you want to deactivate this tour? It will be hidden from customers.';

    if (!confirm(confirmMessage)) {
        return;
    }

    try {
        const response = await Config.api.updateTourStatus(tourId, isActive);
        const result = await response.json();

        if (result.success) {
            Config.utils.showMessage(result.message, 'success');
            // Refresh tours table
            loadAdminTours();
        } else {
            Config.utils.showMessage('Failed to update tour status: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error updating tour status:', error);
        Config.utils.showMessage('Network error: Unable to update tour status.', 'error');
    }
}

// Global function to delete tour
async function deleteTour(tourId) {
    if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await Config.api.deleteTour(tourId);
        const result = await response.json();

        if (result.success) {
            Config.utils.showMessage('Tour deleted successfully!', 'success');
            // Refresh tours table
            loadAdminTours();
        } else {
            Config.utils.showMessage('Failed to delete tour: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting tour:', error);
        Config.utils.showMessage('Network error: Unable to delete tour.', 'error');
    }
}
