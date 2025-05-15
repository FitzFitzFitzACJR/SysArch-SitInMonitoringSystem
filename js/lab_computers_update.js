/**
 * This script updates the loadLabComputers function to check for locked status
 * and ensures that locked computers can't be selected in the sit-in form
 */

// The original loadLabComputers function with support for locked computers
function loadLabComputers() {
    const lab = document.getElementById('labSelector').value;
    const computersGrid = document.getElementById('computersGrid');
    const labTitle = document.getElementById('labTitle');
    
    if (!lab) {
        // If no lab is selected, show placeholder message
        computersGrid.innerHTML = `
            <div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <p>Please select a laboratory to view computers</p>
            </div>
        `;
        labTitle.textContent = 'Lab Status';
        return;
    }
    
    // Update the lab title
    labTitle.textContent = `Lab ${lab} - Select a Computer`;
    
    // Show loading indicator
    computersGrid.innerHTML = `
        <div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">
            <p>Loading computers for Lab ${lab}...</p>
        </div>
    `;
    
    // Get the reservation type to determine behavior
    const reservationType = document.getElementById('reservationType')?.value || '';
    
    // Fetch computer status from the server
    fetch(`get_computer_status.php?lab=${lab}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                // Show error message
                computersGrid.innerHTML = `
                    <div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                        <p>Error: ${data.error}</p>
                    </div>
                `;
            } else {
                // Display the computer data with locked status support
                displayComputers(data, lab, reservationType);
            }
        })
        .catch(error => {
            console.error('Error fetching lab status:', error);
            // Generate demo data
            const demoData = [];
            for (let i = 1; i <= 50; i++) {
                const status = Math.random() > 0.7 ? 'occupied' : Math.random() > 0.8 ? 'reserved' : 'vacant';
                const locked = Math.random() > 0.9; // 10% chance of being locked
                demoData.push({
                    id: i,
                    status: status,
                    locked: locked,
                    student_info: status === 'occupied' ? {
                        name: 'Demo Student',
                        id: '2023-' + i.toString().padStart(4, '0'),
                        since: '30 minutes ago'
                    } : null,
                    reservation_info: status === 'reserved' ? {
                        name: 'Demo Reservation',
                        time: '2:30 PM - 4:00 PM'
                    } : null
                });
            }
            displayComputers(demoData, lab, reservationType);
        });
}

// Updated displayComputers function with locked computer support
function displayComputers(computers, lab, reservationType) {
    const computersGrid = document.getElementById('computersGrid');
    
    // Clear the grid
    computersGrid.innerHTML = '';
    
    // Create computer cards
    computers.forEach(computer => {
        const status = computer.status;
        const locked = computer.locked || false;
        const studentInfo = computer.student_info;
        const reservationInfo = computer.reservation_info;
        
        // Create card
        const computerCard = document.createElement('div');
        computerCard.className = 'computer-card';
        computerCard.style.padding = '15px';
        computerCard.style.borderRadius = '8px';
        computerCard.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';
        
        // Apply the appropriate color based on status and locked state
        if (locked) {
            computerCard.style.backgroundColor = '#333333'; // Dark gray for locked
            computerCard.style.filter = 'blur(1px)'; // Apply blur to locked computers
        } else {
            computerCard.style.backgroundColor = getStatusColor(status);
        }
        
        // Add content to card with locked icon if locked
        computerCard.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <i class="fa ${locked ? 'fa-lock' : 'fa-desktop'}" style="font-size: 36px; color: ${locked ? '#ff4444' : status === 'vacant' ? '#333' : 'white'};"></i>
            </div>
            <h3 style="margin: 0; text-align: center; color: ${locked ? 'white' : status === 'vacant' ? '#333' : 'white'};">PC ${computer.id}</h3>
            <p style="margin: 5px 0; text-align: center; font-weight: bold; color: ${locked ? 'white' : status === 'vacant' ? '#333' : 'white'};">${locked ? 'LOCKED' : status.toUpperCase()}</p>
            ${status === 'occupied' && studentInfo && !locked ? `
                <div style="margin-top: 10px; font-size: 12px; color: white;">
                    <p style="margin: 2px 0;"><strong>Student:</strong> ${studentInfo.name}</p>
                    <p style="margin: 2px 0;"><strong>ID:</strong> ${studentInfo.id}</p>
                    <p style="margin: 2px 0;"><strong>Since:</strong> ${studentInfo.since}</p>
                </div>
            ` : ''}
            ${status === 'reserved' && reservationInfo && !locked ? `
                <div style="margin-top: 10px; font-size: 12px; color: white;">
                    <p style="margin: 2px 0;"><strong>Reserved for:</strong> ${reservationInfo.name}</p>
                    <p style="margin: 2px 0;"><strong>Time:</strong> ${reservationInfo.time}</p>
                </div>
            ` : ''}
            ${status === 'vacant' && !locked ? `
                <button onclick="assignComputer(${computer.id}, '${lab}')" style="width: 100%; margin-top: 10px; padding: 5px; background-color: #E0B0FF; border: none; border-radius: 4px; cursor: pointer; color: black; font-weight: bold;">Select</button>
            ` : ''}
        `;
        
        computersGrid.appendChild(computerCard);
    });
    
    // Add Cancel button at the bottom
    const cancelButton = document.createElement('div');
    cancelButton.style.gridColumn = '1/-1';
    cancelButton.style.textAlign = 'center';
    cancelButton.style.marginTop = '20px';
    cancelButton.innerHTML = `
        <button onclick="closeComputerControlModal()" style="padding: 10px 30px; background-color: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Cancel</button>
    `;
    computersGrid.appendChild(cancelButton);
}

// Replace the existing loadLabComputers function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if the original loadLabComputers function exists
    if (typeof window.originalLoadLabComputers === 'undefined' && typeof loadLabComputers === 'function') {
        // Save the original function if it hasn't been saved yet
        window.originalLoadLabComputers = loadLabComputers;
        
        // Add stats about locked computers to the UI
        const labComputersContainer = document.querySelector('.lab-computers-container .current-status div');
        if (labComputersContainer) {
            const lockedIndicator = document.createElement('div');
            lockedIndicator.style.display = 'flex';
            lockedIndicator.style.alignItems = 'center';
            lockedIndicator.innerHTML = `
                <div style="width: 15px; height: 15px; background-color: #333333; border-radius: 50%; margin-right: 5px;"></div>
                <span>Locked</span>
            `;
            labComputersContainer.appendChild(lockedIndicator);
        }
    }
}); 