<?php
// Force error display
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Create a direct JavaScript fix using string concatenation instead of template literals
$js_code = <<<'EOT'
<script>
/**
 * Loads computer status data for the selected lab
 */
function loadControlComputers() {
    const labId = document.getElementById('controlLabSelector').value;
    if (!labId) {
        document.getElementById('controlComputersGrid').innerHTML = 
            '<div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">' +
            '<p>Please select a laboratory to view computers</p></div>';
        return;
    }
    
    // Show a loading message
    document.getElementById('controlComputersGrid').innerHTML = 
        '<div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">' +
        '<p>Loading computers for Lab ' + labId + '...</p></div>';
    
    // Fetch computer status data
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'get_computer_status.php?lab=' + labId, true);
    
    xhr.onload = function() {
        if (this.status === 200) {
            try {
                // Parse the response JSON
                const computers = JSON.parse(this.responseText);
                console.log("Response data:", computers);
                
                // Check if we got data back
                if (!computers || !computers.length) {
                    document.getElementById('controlComputersGrid').innerHTML = 
                        '<div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">' +
                        '<p>No computer data available for this lab</p></div>';
                    return;
                }
                
                // Generate the computer grid
                let html = '';
                const total = computers.length;
                
                for (let i = 0; i < total; i++) {
                    const computer = computers[i];
                    
                    // Determine status and color
                    let statusColor = '#8fda8f'; // Default green for vacant
                    let statusText = 'Vacant';
                    let iconHtml = '';
                    
                    if (computer.locked) {
                        statusColor = '#888888'; // Gray for locked
                        statusText = 'Locked';
                        iconHtml = '<div style="margin-top: 5px;"><i class="fa fa-lock"></i></div>';
                    } else if (computer.status === 'occupied') {
                        statusColor = '#ff8080'; // Red for occupied
                        statusText = 'Occupied';
                    } else if (computer.status === 'reserved') {
                        statusColor = '#e0b0ff'; // Purple for reserved
                        statusText = 'Reserved';
                    }
                    
                    // Create computer element using string concatenation instead of template literals
                    html += '<div class="computer-item" data-pc="' + computer.id + '" data-lab="' + labId + '" data-locked="' + computer.locked + '" ' +
                         'style="background-color: ' + statusColor + '; padding: 15px; border-radius: 8px; text-align: center; cursor: pointer; transition: all 0.3s ease;" ' +
                         'onclick="toggleComputerStatus(\'' + labId + '\', ' + computer.id + ')">' +
                        '<div style="font-weight: bold; margin-bottom: 5px;">PC ' + computer.id + '</div>' +
                        '<div style="font-size: 13px; text-transform: capitalize;">' + statusText + '</div>' +
                        iconHtml +
                    '</div>';
                }
                
                document.getElementById('controlComputersGrid').innerHTML = html;
                
                // Update lab stats
                const vacantCount = computers.filter(c => !c.locked && c.status === 'vacant').length;
                const occupiedCount = computers.filter(c => c.status === 'occupied').length;
                const reservedCount = computers.filter(c => c.status === 'reserved').length;
                const lockedCount = computers.filter(c => c.locked).length;
                
                const statsHtml = 
                    '<strong>Lab ' + labId + '</strong> | ' +
                    '<span style="color: #8fda8f;">Vacant: ' + vacantCount + '</span> | ' +
                    '<span style="color: #ff8080;">Occupied: ' + occupiedCount + '</span> | ' +
                    '<span style="color: #e0b0ff;">Reserved: ' + reservedCount + '</span> | ' +
                    '<span style="color: #888888;">Locked: ' + lockedCount + '</span> | ' +
                    'Total PCs: ' + total;
                
                document.getElementById('lab-stats').innerHTML = statsHtml;
                
            } catch (e) {
                console.error('Error parsing JSON response:', e);
                document.getElementById('controlComputersGrid').innerHTML = 
                    '<div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">' +
                    '<p>Error processing data. Please try again.</p>' +
                    '<p>Details: ' + e.message + '</p>' +
                    '<p>Raw response: ' + this.responseText.substring(0, 100) + '...</p></div>';
            }
        } else {
            document.getElementById('controlComputersGrid').innerHTML = 
                '<div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">' +
                '<p>Error loading computers. Server returned status: ' + this.status + '</p></div>';
        }
    };
    
    xhr.onerror = function() {
        document.getElementById('controlComputersGrid').innerHTML = 
            '<div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">' +
            '<p>Network error occurred. Please try again.</p></div>';
    };
    
    xhr.send();
}

/**
 * Toggles a computer's lock status
 * @param {string} labId - The lab ID
 * @param {number} computerId - The computer number
 */
function toggleComputerStatus(labId, computerId) {
    // Remove confirmation dialog
    
    // Create form data to send
    const formData = new FormData();
    formData.append('lab', labId);
    formData.append('computer', computerId);
    
    // Show loading state
    const computerElement = document.querySelector('.computer-item[data-pc="' + computerId + '"]');
    if (computerElement) {
        computerElement.style.opacity = '0.5';
    }
    
    // Send request to toggle computer status
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'toggle_computer_status.php', true);
    
    xhr.onload = function() {
        if (this.status === 200) {
            // Reload the computer grid to reflect changes
            loadControlComputers();
        } else {
            alert('Error toggling computer status. Server returned status: ' + this.status);
            if (computerElement) {
                computerElement.style.opacity = '1';
            }
        }
    };
    
    xhr.onerror = function() {
        alert('Network error occurred. Please try again.');
        if (computerElement) {
            computerElement.style.opacity = '1';
        }
    };
    
    xhr.send(formData);
}
</script>
EOT;

// Apply the fix to homepage.php
try {
    // Read current content
    $filename = 'homepage.php';
    $content = file_get_contents($filename);
    
    if ($content === false) {
        throw new Exception("Could not read the homepage.php file.");
    }
    
    // Make a backup
    $backup = $filename . '.backup.' . time();
    if (!file_put_contents($backup, $content)) {
        throw new Exception("Failed to create backup file.");
    }
    
    // Check if function already exists in file
    $has_function = strpos($content, 'function loadControlComputers') !== false;
    
    if ($has_function) {
        // Replace existing function by finding start and end
        $start_pos = strpos($content, 'function loadControlComputers');
        if ($start_pos !== false) {
            // Find previous script tag
            $script_start = strrpos(substr($content, 0, $start_pos), '<script');
            if ($script_start !== false) {
                // Find closing script tag after function
                $script_end = strpos($content, '</script>', $start_pos);
                if ($script_end !== false) {
                    // Replace the entire script block
                    $content = substr($content, 0, $script_start) . $js_code . substr($content, $script_end + 9);
                }
            }
        }
    } else {
        // Add function before closing body tag
        $pos = strrpos($content, '</body>');
        if ($pos !== false) {
            $content = substr($content, 0, $pos) . $js_code . substr($content, $pos);
        } else {
            // If no </body> tag found, add before </html>
            $pos = strrpos($content, '</html>');
            if ($pos !== false) {
                $content = substr($content, 0, $pos) . $js_code . substr($content, $pos);
            } else {
                // Last resort: append to end of file
                $content .= $js_code;
            }
        }
    }
    
    // Write the updated content back to the file
    if (!file_put_contents($filename, $content)) {
        throw new Exception("Failed to write updated content to homepage.php.");
    }
    
    echo "<div style='background-color: #d4edda; border-color: #c3e6cb; color: #155724; padding: 15px; border: 1px solid transparent; border-radius: 4px; margin: 20px 0;'>";
    echo "<h3>Success!</h3>";
    echo "<p>The computer control functions have been " . ($has_function ? "updated" : "added") . " to homepage.php.</p>";
    echo "<p>A backup of the original file was created at: $backup</p>";
    echo "</div>";
    
    echo "<div style='margin-top: 20px;'>";
    echo "<a href='homepage.php' style='display: inline-block; background-color: #E0B0FF; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; margin-right: 10px;'>Go to Homepage</a>";
    echo "<a href='computer_control_test.php' style='display: inline-block; background-color: #6c757d; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;'>Test Computer Control</a>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "<div style='background-color: #f8d7da; border-color: #f5c6cb; color: #721c24; padding: 15px; border: 1px solid transparent; border-radius: 4px; margin: 20px 0;'>";
    echo "<h3>Error</h3>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}
?> 