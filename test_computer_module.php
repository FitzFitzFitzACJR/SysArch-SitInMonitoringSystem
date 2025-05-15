<?php
session_start();
include("database.php");

// Ensure the user is logged in as admin
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    die("This test requires admin access. Please <a href='index.php'>login</a> as an administrator.");
}

// Create necessary tables for testing if they don't exist
$check_table = mysqli_query($conn, "SHOW TABLES LIKE 'lab_computers'");
if (mysqli_num_rows($check_table) == 0) {
    $create_table = "CREATE TABLE lab_computers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        computer_number INT NOT NULL,
        lab_id VARCHAR(10) NOT NULL,
        status ENUM('vacant', 'occupied', 'reserved') DEFAULT 'vacant',
        locked BOOLEAN DEFAULT FALSE,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_computer (computer_number, lab_id)
    )";
    
    mysqli_query($conn, $create_table);
    
    // Create sample data for testing
    $labs = ['524', '526', '528', '530'];
    foreach ($labs as $lab) {
        for ($i = 1; $i <= 50; $i++) {
            $insert = "INSERT INTO lab_computers (computer_number, lab_id, status, locked) 
                     VALUES ($i, '$lab', 'vacant', " . ($i % 5 == 0 ? "1" : "0") . ")";
            mysqli_query($conn, $insert);
        }
    }
    
    echo "<div style='background-color: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 5px;'>
        Created test lab_computers table with sample data
    </div>";
}

// Mark some computers as occupied for testing
$check_occupied = mysqli_query($conn, "SELECT COUNT(*) as count FROM lab_computers WHERE status = 'occupied'");
$occupied_count = mysqli_fetch_assoc($check_occupied)['count'];

if ($occupied_count < 5) {
    // Mark 5 computers as occupied
    $update_occupied = "UPDATE lab_computers SET status = 'occupied' 
                       WHERE id IN (SELECT id FROM (SELECT id FROM lab_computers WHERE status = 'vacant' AND locked = 0 LIMIT 5) as t)";
    mysqli_query($conn, $update_occupied);
    
    echo "<div style='background-color: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 5px;'>
        Marked 5 computers as occupied for testing
    </div>";
}

// Mark some computers as reserved for testing
$check_reserved = mysqli_query($conn, "SELECT COUNT(*) as count FROM lab_computers WHERE status = 'reserved'");
$reserved_count = mysqli_fetch_assoc($check_reserved)['count'];

if ($reserved_count < 5) {
    // Mark 5 computers as reserved
    $update_reserved = "UPDATE lab_computers SET status = 'reserved' 
                       WHERE id IN (SELECT id FROM (SELECT id FROM lab_computers WHERE status = 'vacant' AND locked = 0 LIMIT 5) as t)";
    mysqli_query($conn, $update_reserved);
    
    echo "<div style='background-color: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 5px;'>
        Marked 5 computers as reserved for testing
    </div>";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Computer Control Module Test</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #333;
            margin-top: 0;
        }
        
        .test-results {
            margin-top: 20px;
            padding: 15px;
            background-color: #e9f7fd;
            border-radius: 5px;
        }
        
        .back-link {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 15px;
            background-color: #E0B0FF;
            color: black;
            text-decoration: none;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Computer Control Module Test</h1>
        
        <div id="computer-control">
            <h2>Computer Control</h2>
            
            <div>
                <label for="controlLabSelector">Select Laboratory:</label>
                <select id="controlLabSelector" onchange="loadControlComputers()">
                    <option value="">-- Select Lab --</option>
                    <option value="524">Lab 524</option>
                    <option value="526">Lab 526</option>
                    <option value="528">Lab 528</option>
                    <option value="530">Lab 530</option>
                </select>
            </div>
            
            <div id="lab-stats" style="margin-top: 20px;">
                <!-- Lab statistics will be displayed here -->
            </div>
            
            <div id="controlComputersGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-top: 20px;">
                <!-- Computer grid will be loaded here -->
                <div class="placeholder-message" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                    <p>Please select a laboratory to view computers</p>
                </div>
            </div>
        </div>
        
        <div class="test-results">
            <h3>API Tests</h3>
            <p>Click the buttons below to test the API endpoints:</p>
            
            <button onclick="testGetComputers()">Test Get Computers</button>
            <button onclick="testToggleComputer()">Test Toggle Computer</button>
            <button onclick="testToggleAll()">Test Toggle All</button>
            
            <div id="testResults" style="margin-top: 10px; white-space: pre-wrap;"></div>
        </div>
        
        <a href="homepage.php" class="back-link">Back to Homepage</a>
    </div>
    
    <!-- Include the computer control module script -->
    <?php include('computer_control_module.php'); ?>
    
    <script>
    // Test function for get_computer_status.php
    function testGetComputers() {
        const lab = document.getElementById('controlLabSelector').value || '524';
        
        fetch(`get_computer_status.php?lab=${lab}`)
            .then(response => response.json())
            .then(data => {
                // Count status breakdown
                const stats = {
                    vacant: 0,
                    occupied: 0,
                    reserved: 0,
                    locked: 0,
                    total: data.length
                };
                
                data.forEach(computer => {
                    if (computer.locked) {
                        stats.locked++;
                    } else if (computer.status === 'occupied') {
                        stats.occupied++;
                    } else if (computer.status === 'reserved') {
                        stats.reserved++;
                    } else {
                        stats.vacant++;
                    }
                });
                
                // Display results
                document.getElementById('testResults').textContent = 
                    `GET Computer Status Test:\n` +
                    `Total computers: ${stats.total}\n` +
                    `Vacant: ${stats.vacant}\n` +
                    `Occupied: ${stats.occupied}\n` +
                    `Reserved: ${stats.reserved}\n` +
                    `Locked: ${stats.locked}\n\n` +
                    `First 5 computers: ${JSON.stringify(data.slice(0, 5), null, 2)}`;
            })
            .catch(error => {
                document.getElementById('testResults').textContent = 
                    `Error testing get_computer_status.php: ${error.message}`;
            });
    }
    
    // Test function for toggle_computer_status.php
    function testToggleComputer() {
        const lab = document.getElementById('controlLabSelector').value || '524';
        const computerId = 1; // Test with computer 1
        
        const formData = new FormData();
        formData.append('lab', lab);
        formData.append('computer', computerId);
        
        fetch('toggle_computer_status.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('testResults').textContent = 
                `Toggle Computer Test:\n` +
                `Response: ${JSON.stringify(data, null, 2)}\n\n` +
                `After toggle, refreshing computer data...`;
            
            // Reload computers to show the change
            setTimeout(testGetComputers, 500);
        })
        .catch(error => {
            document.getElementById('testResults').textContent = 
                `Error testing toggle_computer_status.php: ${error.message}`;
        });
    }
    
    // Test function for unlock_all_computers.php
    function testToggleAll() {
        const lab = document.getElementById('controlLabSelector').value || '524';
        
        // Get current stats to determine if we should lock or unlock
        fetch(`get_computer_status.php?lab=${lab}`)
            .then(response => response.json())
            .then(data => {
                // Count locked computers
                const lockedCount = data.filter(c => c.locked).length;
                
                // Decide whether to lock or unlock
                const mode = lockedCount > (data.length / 2) ? 'unlock' : 'lock';
                
                const formData = new FormData();
                formData.append('lab', lab);
                formData.append('mode', mode);
                
                return fetch('unlock_all_computers.php', {
                    method: 'POST',
                    body: formData
                });
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('testResults').textContent = 
                    `Toggle All Computers Test:\n` +
                    `Response: ${JSON.stringify(data, null, 2)}\n\n` +
                    `After toggle all, refreshing computer data...`;
                
                // Reload computers to show the change
                setTimeout(testGetComputers, 500);
            })
            .catch(error => {
                document.getElementById('testResults').textContent = 
                    `Error testing unlock_all_computers.php: ${error.message}`;
            });
    }
    </script>
</body>
</html> 