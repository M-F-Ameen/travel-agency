// Dynamic tours loading for index.html
document.addEventListener('DOMContentLoaded', function() {
    // Load config if not already loaded
    if (!window.Config) {
        console.error('Config module not loaded');
        return;
    }

    loadTours();
});

async function loadTours() {
    const toursContainer = document.querySelector('.row.row-50');
    const parallaxText = document.querySelector('.parallax-text');

    if (!toursContainer) return;

    try {
        // Update text to show loading
        if (parallaxText) {
            parallaxText.textContent = 'Loading tours...';
        }

        // Fetch tours from API
        const response = await Config.api.getTours();
        const result = await response.json();

        if (result.success) {
            displayTours(result.data);

            // Restore original text
            if (parallaxText) {
                parallaxText.textContent = 'Hot tours';
            }
        } else {
            console.error('Failed to load tours:', result.message);
            showToursError('Failed to load tours. Please refresh to try again.');
        }
    } catch (error) {
        console.error('Error loading tours:', error);
        showToursError('Unable to load tours. Please check your connection.');

        // Restore original text
        if (parallaxText) {
            parallaxText.textContent = 'Hot tours';
        }
    }
}

function displayTours(tours) {
    const toursContainer = document.querySelector('.row.row-50');

    if (!toursContainer) return;

    // Clear existing tours
    toursContainer.innerHTML = '';

    if (tours.length === 0) {
        toursContainer.innerHTML = `
            <div class="col-12" style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🏖️</div>
                <h3 style="color: #2c3e50; margin-bottom: 15px;">No tours available</h3>
                <p style="color: #7f8c8d; font-size: 1.1rem;">New tours coming soon! Check back later.</p>
            </div>
        `;
        return;
    }

    // Create tour cards
    tours.forEach(tour => {
        const tourCard = createTourCard(tour);
        toursContainer.appendChild(tourCard);
    });
}

function createTourCard(tour) {
    const colDiv = document.createElement('div');
    colDiv.className = 'col-5-per-row';

    // Generate tour identifier for viewTour function
    const tourIdentifier = tour.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Get category color
    const categoryColors = {
        adventure: '#e67e22',
        cultural: '#9b59b6',
        luxury: '#e74c3c',
        family: '#27ae60',
        romantic: '#e91e63'
    };
    const categoryColor = categoryColors[tour.category] || '#3498db';

    colDiv.innerHTML = `
        <article class="event-default-wrap" data-tour="${tourIdentifier}" onclick="viewTour(this.dataset.tour)" style="cursor: pointer;">
            <div class="event-default">
                <figure class="event-default-image">
                    <img src="${tour.imageUrl}" alt="${Config.utils.escapeHtml(tour.title)}" width="570" height="370" />
                    <div class="event-default-overlay">
                        <h5>
                            <a class="event-default-title" href="#">${Config.utils.escapeHtml(tour.title)}</a>
                        </h5>
                        <p title="${Config.utils.escapeHtml(tour.description)}">
                            ${Config.utils.escapeHtml(tour.description.length > 80 ? tour.description.substring(0, 80) + '...' : tour.description)}
                        </p>
                        <span class="heading-5" style="display: block; margin-bottom: 15px; color: ${categoryColor}; font-weight: 600;">
                            ${tour.category.charAt(0).toUpperCase() + tour.category.slice(1)} Tour • ${tour.duration}
                        </span>
                        <span class="heading-5">from $${tour.price.toLocaleString()}</span>
                        <a class="event-default-button" href="#" onclick="event.stopPropagation(); bookTour('${tourIdentifier}');">
                            book now
                        </a>
                    </div>
                </figure>
            </div>
        </article>
    `;

    return colDiv;
}

function showToursError(message) {
    const toursContainer = document.querySelector('.row.row-50');

    if (!toursContainer) return;

    toursContainer.innerHTML = `
        <div class="col-12" style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
            <h3 style="color: #dc3545; margin-bottom: 15px;">Unable to Load Tours</h3>
            <p style="color: #7f8c8d; font-size: 1.1rem; margin-bottom: 20px;">${message}</p>
            <button onclick="loadTours()" class="btn btn-primary" style="padding: 12px 24px; background: #D4AF37; color: #2c3e50; border: none; border-radius: 25px; font-weight: 600; cursor: pointer;">
                Try Again
            </button>
        </div>
    `;
}

// Enhanced booking function for tour cards
function bookTour(tourIdentifier) {
    // Store the selected tour for the booking form
    sessionStorage.setItem('selectedTour', tourIdentifier);

    // Scroll to booking section or open modal
    const bookingSection = document.querySelector('#booking-section, .swiper-form-wrap');
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });

        // Pre-fill tour information if possible
        const tourSelect = document.querySelector('#tour-select, select[name="tour"]');
        if (tourSelect) {
            // This would be enhanced with actual tour data mapping
            Config.utils.showMessage(`Selected tour: ${tourIdentifier.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`, 'info');
        }
    }

    // Show success message
    Config.utils.showMessage('Tour selected! Please fill in your booking details below.', 'success');
}

// Enhanced viewTour function to work with dynamic tours
function viewTour(tourIdentifier) {
    // Navigate to tour detail page with tour identifier
    const tourUrl = `tour-detail.html?tour=${encodeURIComponent(tourIdentifier)}`;
    window.location.href = tourUrl;
}
