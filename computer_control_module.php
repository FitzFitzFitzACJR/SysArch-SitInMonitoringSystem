<!-- Computer Control Module -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for Computer Control link in admin sidebar
    const computerControlLink = document.querySelector('a[href="#computer-control"]');
    if (computerControlLink) {
        computerControlLink.addEventListener('click', function(e) {
            e.preventDefault();
            showComputerControl();
        });
    }
});

// Function to show the Computer Control section
function showComputerControl() {
    // Hide all admin sections
    document.querySelectorAll('.admin-section, .admin-dashboard > div').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show Computer Control section
    const computerControl = document.getElementById('computer-control');
    if (computerControl) {
        computerControl.style.display = 'block';
        
        // Load computers for the first time if lab is selected
        const labSelector = document.getElementById('controlLabSelector');
        if (labSelector && labSelector.value) {
            loadControlComputers();
        }
    }
}

// Function to load computers for a specific lab
function loadControlComputers() {
    const labSelector = document.getElementById('controlLabSelector');
    const computersGrid = document.getElementById('controlComputersGrid');
    
    if (!labSelector || !computersGrid) {
        console.error('Required elements not found');
        return;
    }
    
    const selectedLab = labSelector.value;
    
    if (!selectedLab) {
        computersGrid.innerHTML = `
            <div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <p>Please select a laboratory to view computers</p>
            </div>
        `;
        return;
    }
    
    // Show loading state
    computersGrid.innerHTML = `
        <div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">
            <p>Loading computers for Lab ${selectedLab}...</p>
        </div>
    `;
    
    // Fetch computers from the server
    fetch(`get_computer_status.php?lab=${selectedLab}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(computers => {
            // Clear the grid
            computersGrid.innerHTML = '';
            
            // Count statistics
            let stats = {
                vacant: 0,
                occupied: 0,
                reserved: 0,
                locked: 0,
                total: computers.length
            };
            
            // Create computer cards
            computers.forEach(computer => {
                // First check if it's locked, since that's the primary status
                if (computer.locked) {
                    stats.locked++;
                    // A locked computer is not counted as vacant
                } else {
                    // Only count unlocked computers in these categories
                    if (computer.status === 'occupied') {
                        stats.occupied++;
                    } else if (computer.status === 'reserved') {
                        stats.reserved++;
                    } else {
                        stats.vacant++;
                    }
                }
                
                const card = document.createElement('div');
                card.className = 'computer-card';
                card.dataset.id = computer.id;
                card.dataset.status = computer.status || 'vacant';
                card.dataset.locked = computer.locked ? 'true' : 'false';
                
                // Set card style based on status
                const cardStyle = getCardStyle(computer.status, computer.locked);
                
                card.innerHTML = `
                    <div class="card-content" style="${cardStyle.container}">
                        <div class="computer-icon" onclick="toggleComputerLock(${computer.id}, '${selectedLab}')" style="${cardStyle.icon}">
                            <i class="fa ${computer.locked ? 'fa-lock' : 'fa-desktop'}" style="font-size: 24px;"></i>
                        </div>
                        <div class="computer-info">
                            <div class="computer-number">PC ${computer.id}</div>
                            <div class="computer-status">${getStatusLabel(computer.status, computer.locked)}</div>
                        </div>
                    </div>
                `;
                
                computersGrid.appendChild(card);
            });
            
            // Update stats display
            updateLabStats(stats);
        })
        .catch(error => {
            console.error('Error loading computers:', error);
            computersGrid.innerHTML = `
                <div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                    <p>Error loading computers. Please try again.</p>
                    <p>Details: ${error.message}</p>
                </div>
            `;
        });
}

// Function to toggle computer locked status
function toggleComputerLock(computerId, labId) {
    // Remove confirmation dialog
    
    // Create form data for the request
    const formData = new FormData();
    formData.append('computer', computerId);
    formData.append('lab', labId);
    
    // Find and update the UI element
    const computerCard = document.querySelector(`.computer-card[data-id="${computerId}"]`);
    if (computerCard) {
        computerCard.style.opacity = '0.5'; // Visual feedback
    }
    
    // Send the request to toggle the computer status
    fetch('toggle_computer_status.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server returned status: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Reload the computers to reflect the change
            loadControlComputers();
        } else {
            // Display error message
            alert('Error: ' + data.message);
            if (computerCard) {
                computerCard.style.opacity = '1'; // Restore opacity
            }
        }
    })
    .catch(error => {
        console.error('Error toggling computer status:', error);
        alert('An error occurred while toggling computer status. Please try again.');
        if (computerCard) {
            computerCard.style.opacity = '1'; // Restore opacity
        }
    });
}

// Function to get the style for computer cards based on status
function getCardStyle(status, locked) {
    const base = {
        container: 'padding: 15px; border-radius: 8px; cursor: pointer; margin-bottom: 10px; transition: all 0.3s ease;',
        icon: 'text-align: center; margin-bottom: 10px;'
    };
    
    if (locked) {
        return {
            container: base.container + 'background-color: #333; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.2); filter: blur(1px);',
            icon: base.icon + 'color: #ff4444;'
        };
    }
    
    switch (status) {
        case 'vacant':
            return {
                container: base.container + 'background-color: #8fda8f; color: #333; box-shadow: 0 2px 6px rgba(0,0,0,0.1);',
                icon: base.icon + 'color: #333;'
            };
        case 'occupied':
            return {
                container: base.container + 'background-color: #ff8080; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.1);',
                icon: base.icon + 'color: white;'
            };
        case 'reserved':
            return {
                container: base.container + 'background-color: #e0b0ff; color: #333; box-shadow: 0 2px 6px rgba(0,0,0,0.1);',
                icon: base.icon + 'color: #333;'
            };
        default:
            return {
                container: base.container + 'background-color: #e0e0e0; color: #333; box-shadow: 0 2px 6px rgba(0,0,0,0.1);',
                icon: base.icon + 'color: #333;'
            };
    }
}

// Function to get status label
function getStatusLabel(status, locked) {
    if (locked) return 'LOCKED';
    
    switch (status) {
        case 'vacant':
            return 'VACANT';
        case 'occupied':
            return 'OCCUPIED';
        case 'reserved':
            return 'RESERVED';
        default:
            return 'UNKNOWN';
    }
}

// Function to update lab statistics display
function updateLabStats(stats) {
    const statsContainer = document.getElementById('lab-stats');
    if (!statsContainer) return;
    
    const selectedLab = document.getElementById('controlLabSelector').value;
    
    statsContainer.innerHTML = `
        <div style="display: flex; justify-content: space-around; padding: 10px; background-color: white; border-radius: 8px; margin-bottom: 20px;">
            <div style="text-align: center; padding: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #8fda8f;">${stats.vacant}</div>
                <div>Vacant</div>
            </div>
            <div style="text-align: center; padding: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #ff8080;">${stats.occupied}</div>
                <div>Occupied</div>
            </div>
            <div style="text-align: center; padding: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #e0b0ff;">${stats.reserved}</div>
                <div>Reserved</div>
            </div>
            <div style="text-align: center; padding: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #333;">${stats.locked}</div>
                <div>Locked</div>
            </div>
            <div style="text-align: center; padding: 10px;">
                <div style="font-size: 24px; font-weight: bold; color: #6c757d;">${stats.total}</div>
                <div>Total</div>
            </div>
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
            <button onclick="toggleAllComputers('${selectedLab}')" class="control-action-btn" style="background-color: #E0B0FF; color: black;">
                <i class="fa ${stats.locked > 0 ? 'fa-unlock' : 'fa-lock'}"></i> ${stats.locked > 0 ? 'Unlock All' : 'Lock All'} Computers
            </button>
        </div>
    `;
}

// Function to toggle all computers in a lab
function toggleAllComputers(labId) {
    if (!labId) {
        alert('Please select a laboratory first');
        return;
    }
    
    // Determine the current state (whether we have locked computers)
    const statsContainer = document.getElementById('lab-stats');
    const lockButton = statsContainer.querySelector('.control-action-btn');
    const isUnlockAction = lockButton.innerHTML.includes('Unlock All');
    const mode = isUnlockAction ? 'unlock' : 'lock';
    
    const confirmMessage = isUnlockAction 
        ? `Are you sure you want to unlock all computers in Lab ${labId}?`
        : `Are you sure you want to lock all computers in Lab ${labId}? This will not affect computers that are currently in use.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Create form data for the request
    const formData = new FormData();
    formData.append('lab', labId);
    formData.append('mode', mode);
    
    // Show loading state
    document.getElementById('controlComputersGrid').style.opacity = '0.5';
    
    // Send the request to toggle all computers
    fetch('unlock_all_computers.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server returned status: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Show success message
            alert(data.message);
            // Reload the computers to reflect the change
            loadControlComputers();
        } else {
            // Display error message
            alert('Error: ' + data.message);
            document.getElementById('controlComputersGrid').style.opacity = '1';
        }
    })
    .catch(error => {
        console.error('Error toggling computers:', error);
        alert('An error occurred while toggling computers. Please try again.');
        document.getElementById('controlComputersGrid').style.opacity = '1';
    });
}
</script>

<style>
/* Computer Control Styles */
#computer-control {
    padding: 20px;
    background-color: #f9f0ff;
    min-height: 80vh;
}

/* Make the section title more visible */
#computer-control h2 {
    color: #333;
    background-color: white;
    padding: 10px 15px;
    border-radius: 5px;
    margin-bottom: 20px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

#controlComputersGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
    margin-top: 20px;
    max-height: 65vh;
    overflow-y: auto;
    padding: 10px;
    background-color: white;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.computer-card {
    transition: transform 0.2s;
}

.computer-card:hover {
    transform: translateY(-3px);
}

.computer-number {
    font-weight: bold;
    font-size: 16px;
    margin-top: 5px;
    text-align: center;
}

.computer-status {
    text-align: center;
    font-size: 12px;
    margin-top: 3px;
}

.computer-icon {
    cursor: pointer;
    text-align: center;
    font-size: 20px;
    margin-bottom: 5px;
}

/* Lab control actions */
.lab-control-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    justify-content: center;
}

.control-action-btn {
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
}
</style> 