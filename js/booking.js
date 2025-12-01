// Booking form submission to backend API
document.addEventListener('DOMContentLoaded', function() {
    // Load config if not already loaded
    if (!window.Config) {
        console.error('Config module not loaded');
        return;
    }
    const bookingForm = document.getElementById('booking-form');

    if (bookingForm) {
        // Add real-time validation
        setupFormValidation(bookingForm);

        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Validate all fields before submission
            const fields = bookingForm.querySelectorAll('input, select, textarea');
            let isFormValid = true;

            fields.forEach(field => {
                if (field.name && field.name in {
                    name: true,
                    phone: true,
                    email: true,
                    adults: true,
                    'travel-date': true,
                    'confirm-trip': true
                }) {
                    const rules = getFieldRules(field.name);
                    if (!validateField(field, rules)) {
                        isFormValid = false;
                    }
                }
            });

            if (!isFormValid) {
                Config.utils.showMessage('Please correct the errors below and try again.', 'warning');
                return;
            }

            const submitButton = bookingForm.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;

            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span>Sending...</span>';

            try {
                // Collect form data
                const formData = new FormData(bookingForm);
                const bookingData = {
                    name: formData.get('name'),
                    phone: formData.get('phone'),
                    email: formData.get('email'),
                    adults: parseInt(formData.get('adults')),
                    children: parseInt(formData.get('children')) || 0,
                    'travel-date': formData.get('travel-date'),
                    confirmTrip: formData.get('confirm-trip'),
                    message: formData.get('message') || ''
                };

                //Get tour ID from form
                const tourId = formData.get('tour-id');

                // Convert travel-date to the backend expected format
                const travelDate = new Date(bookingData['travel-date']);
                bookingData.travelDate = travelDate.toISOString();

                // Remove the temp field
                delete bookingData['travel-date'];

                // Add tour ID for reference
                bookingData.tourId = tourId;

                // Send to backend
                const response = await Config.api.createBooking(bookingData);

                const result = await response.json();

                if (result.success) {
                    // Success
                    Config.utils.showMessage(result.message || Config.MESSAGES.BOOKING_SUCCESS, 'success');

                    // Reset form
                    bookingForm.reset();

                    // Optionally redirect to home page
                    // window.location.href = 'index.html';

                } else {
                    // Show validation errors
                    let errorMessage = result.message || 'An error occurred';
                    if (result.errors) {
                        errorMessage = result.errors.map(err => err.msg).join('\n');
                    }
                    Config.utils.showMessage('Booking failed: ' + errorMessage, 'error');
                }

            } catch (error) {
                console.error('Booking submission error:', error);
                Config.utils.showMessage(Config.MESSAGES.ERROR_NETWORK, 'error');
            } finally {
                // Reset button state
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        });
    }
});

// Form validation function
function setupFormValidation(form) {
    const fields = {
        name: { required: true, minLength: 2, maxLength: 100, pattern: /^[a-zA-Z\s]+$/, message: 'Name must be 2-100 letters only' },
        phone: { required: true, pattern: /^[\+]?[0-9\-\(\)\s]{10,15}$/, message: 'Please enter a valid phone number' },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address' },
        adults: { required: true, min: 1, max: 20, message: 'Adults must be between 1-20' },
        'travel-date': { required: true, futureDate: true, message: 'Please select a future date' },
        'confirm-trip': { required: true, minLength: 5, message: 'Please specify your destination' }
    };

    // Add validation to each field
    Object.keys(fields).forEach(fieldName => {
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (input) {
            input.addEventListener('blur', () => validateField(input, fields[fieldName]));
            input.addEventListener('input', () => clearFieldError(input));
        }
    });

    // Special validation for travel date (can't select past dates)
    const travelDateInput = form.querySelector('[name="travel-date"]');
    if (travelDateInput) {
        const today = new Date().toISOString().split('T')[0];
        travelDateInput.setAttribute('min', today);
    }
}

function getFieldRules(fieldName) {
    const fields = {
        name: { required: true, minLength: 2, maxLength: 100, pattern: /^[a-zA-Z\s]+$/, message: 'Name must be 2-100 letters only' },
        phone: { required: true, pattern: /^[\+]?[0-9\-\(\)\s]{10,15}$/, message: 'Please enter a valid phone number' },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address' },
        adults: { required: true, min: 1, max: 20, message: 'Adults must be between 1-20' },
        'travel-date': { required: true, futureDate: true, message: 'Please select a future date' },
        'confirm-trip': { required: true, minLength: 5, message: 'Please specify your destination' }
    };
    return fields[fieldName] || {};
}

function validateField(input, rules) {
    const value = input.value.trim();
    let isValid = true;
    let message = '';

    // Required validation
    if (rules.required && !value) {
        isValid = false;
        message = 'This field is required';
    }
    // Pattern validation
    else if (rules.pattern && value && !rules.pattern.test(value)) {
        isValid = false;
        message = rules.message;
    }
    // Length validation
    else if (rules.minLength && value.length < rules.minLength) {
        isValid = false;
        message = rules.message;
    }
    else if (rules.maxLength && value.length > rules.maxLength) {
        isValid = false;
        message = rules.message;
    }
    // Number range validation
    else if (rules.min && parseInt(value) < rules.min) {
        isValid = false;
        message = rules.message;
    }
    else if (rules.max && parseInt(value) > rules.max) {
        isValid = false;
        message = rules.message;
    }
    // Future date validation
    else if (rules.futureDate && value) {
        const inputDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (inputDate < today) {
            isValid = false;
            message = rules.message;
        }
    }

    if (!isValid) {
        showFieldError(input, message);
    } else {
        clearFieldError(input);
    }

    return isValid;
}

function showFieldError(input, message) {
    // Remove existing error
    clearFieldError(input);

    // Add error styling
    input.classList.add('error');

    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: #e74c3c;
        font-size: 0.875rem;
        margin-top: 5px;
        display: block;
    `;

    // Insert after input
    input.parentNode.insertBefore(errorDiv, input.nextSibling);

    // Add red border
    input.style.borderColor = '#e74c3c';
}

function clearFieldError(input) {
    // Remove error styling
    input.classList.remove('error');
    input.style.borderColor = '';

    // Remove error message
    const errorDiv = input.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}
