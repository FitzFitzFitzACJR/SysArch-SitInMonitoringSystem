/**
 * Computer Selection Handler for Sit-ins and Reservations
 * This script dynamically updates the computer selection dropdowns
 * based on the selected laboratory and reflects locked computer status
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to both sit-in and reservation lab selectors
    setupSitInComputerSelection();
    setupReservationComputerSelection();
});

/**
 * Setup the laboratory selector for sit-in form to dynamically load computers
 */
function setupSitInComputerSelection() {
    const labSelector = document.getElementById('laboratory');
    const computerContainer = document.getElementById('computer_selection_container');
    
    if (labSelector && computerContainer) {
        // Add event listener to the lab selector
        labSelector.addEventListener('change', function() {
            const selectedLab = this.value;
            if (selectedLab) {
                // Show loading indicator
                computerContainer.innerHTML = '<div class="loading">Loading computers...</div>';
                
                // Fetch computers for the selected lab
                fetch(`get_computers_for_selection.php?lab=${selectedLab}&type=sit-in`)
                    .then(response => response.text())
                    .then(html => {
                        computerContainer.innerHTML = html;
                    })
                    .catch(error => {
                        console.error('Error loading computers:', error);
                        computerContainer.innerHTML = '<div class="error">Error loading computers. Please try again.</div>';
                    });
            } else {
                computerContainer.innerHTML = '<select name="computer_id" id="computer_id" class="form-control" required disabled><option value="">Select a Laboratory First</option></select>';
            }
        });
        
        // Trigger change event if a lab is already selected
        if (labSelector.value) {
            labSelector.dispatchEvent(new Event('change'));
        } else {
            computerContainer.innerHTML = '<select name="computer_id" id="computer_id" class="form-control" required disabled><option value="">Select a Laboratory First</option></select>';
        }
    }
}

/**
 * Setup the laboratory selector for reservation form to dynamically load computers
 */
function setupReservationComputerSelection() {
    const labSelector = document.getElementById('room');
    const computerContainer = document.getElementById('reservation_computer_container');
    
    if (labSelector && computerContainer) {
        // Add event listener to the lab selector
        labSelector.addEventListener('change', function() {
            const selectedLab = this.value;
            if (selectedLab) {
                // Show loading indicator
                computerContainer.innerHTML = '<div class="loading">Loading computers...</div>';
                
                // Fetch computers for the selected lab
                fetch(`get_computers_for_selection.php?lab=${selectedLab}&type=reservation`)
                    .then(response => response.text())
                    .then(html => {
                        computerContainer.innerHTML = html;
                    })
                    .catch(error => {
                        console.error('Error loading computers:', error);
                        computerContainer.innerHTML = '<div class="error">Error loading computers. Please try again.</div>';
                    });
            } else {
                computerContainer.innerHTML = '<select name="computer" id="computer" class="form-control" required disabled><option value="">Select a Laboratory First</option></select>';
            }
        });
        
        // Trigger change event if a lab is already selected
        if (labSelector.value) {
            labSelector.dispatchEvent(new Event('change'));
        } else {
            computerContainer.innerHTML = '<select name="computer" id="computer" class="form-control" required disabled><option value="">Select a Laboratory First</option></select>';
        }
    }
}

/**
 * Function to periodically refresh computer status in background
 * This ensures the displayed status is always up-to-date
 */
function startComputerStatusRefresh() {
    // Refresh every 30 seconds
    setInterval(function() {
        const sitInLabSelector = document.getElementById('laboratory');
        const reservationLabSelector = document.getElementById('room');
        
        // Refresh sit-in computers if visible and lab selected
        if (sitInLabSelector && 
            sitInLabSelector.closest('.section-placeholder').style.display !== 'none' && 
            sitInLabSelector.value) {
            sitInLabSelector.dispatchEvent(new Event('change'));
        }
        
        // Refresh reservation computers if visible and lab selected
        if (reservationLabSelector && 
            reservationLabSelector.closest('.section-placeholder').style.display !== 'none' && 
            reservationLabSelector.value) {
            reservationLabSelector.dispatchEvent(new Event('change'));
        }
    }, 30000); // 30 seconds
}

// Start the background refresh when page loads
document.addEventListener('DOMContentLoaded', function() {
    startComputerStatusRefresh();
}); 