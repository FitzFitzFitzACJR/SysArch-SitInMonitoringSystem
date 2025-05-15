<?php
session_start();
include("database.php");

// Debug info
error_log("User session data: " . json_encode($_SESSION));

// Check if user is authenticated
if (!isset($_SESSION['user'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

// Get the requested lab
$lab = isset($_GET['lab']) ? $_GET['lab'] : null;

if (!$lab) {
    http_response_code(400);
    echo json_encode(['error' => 'Lab ID is required']);
    exit;
}

// Check if the lab_computers table exists
$check_table_query = "SHOW TABLES LIKE 'lab_computers'";
$table_exists = mysqli_query($conn, $check_table_query);

if (mysqli_num_rows($table_exists) == 0) {
    // Table doesn't exist, create it
    $create_table_query = "CREATE TABLE lab_computers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        computer_number INT NOT NULL,
        lab_id VARCHAR(10) NOT NULL,
        status ENUM('vacant', 'occupied', 'reserved') DEFAULT 'vacant',
        locked BOOLEAN DEFAULT FALSE,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_computer (computer_number, lab_id)
    )";
    
    if (!mysqli_query($conn, $create_table_query)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create lab_computers table: ' . mysqli_error($conn)]);
        exit;
    }
    
    // Create default computers for this lab (assuming 50 computers per lab)
    for ($i = 1; $i <= 50; $i++) {
        $insert_query = "INSERT INTO lab_computers (computer_number, lab_id, status, locked) 
                        VALUES ($i, '$lab', 'vacant', 0)";
        mysqli_query($conn, $insert_query);
    }
}

// Get all computers for the lab
$query = "SELECT computer_number as id, status, locked FROM lab_computers WHERE lab_id = ? ORDER BY computer_number";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "s", $lab);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$computers = [];
while ($row = mysqli_fetch_assoc($result)) {
    $computers[] = $row;
}

// If no computers found, create some default ones
if (empty($computers)) {
    // Create default computers for this lab (assuming 50 computers per lab)
    for ($i = 1; $i <= 50; $i++) {
        $insert_query = "INSERT INTO lab_computers (computer_number, lab_id, status, locked) 
                        VALUES ($i, '$lab', 'vacant', 0)";
        mysqli_query($conn, $insert_query);
        
        // Add to the response array
        $computers[] = [
            'id' => $i,
            'status' => 'vacant',
            'locked' => false
        ];
    }
}

// Check for active sit-in sessions in this lab
$sit_in_query = "SELECT computer_id FROM sit_in_sessions 
                WHERE laboratory = ? AND status = 'active'";
$stmt = mysqli_prepare($conn, $sit_in_query);
mysqli_stmt_bind_param($stmt, "s", $lab);
mysqli_stmt_execute($stmt);
$sit_in_result = mysqli_stmt_get_result($stmt);

// Mark computers as occupied based on active sit-in sessions
while ($row = mysqli_fetch_assoc($sit_in_result)) {
    $computer_id = $row['computer_id'];
    
    // Find this computer in our array and mark it as occupied
    foreach ($computers as &$computer) {
        if ($computer['id'] == $computer_id) {
            $computer['status'] = 'occupied';
            
            // Also update the database
            $update_query = "UPDATE lab_computers SET status = 'occupied' 
                            WHERE computer_number = ? AND lab_id = ?";
            $update_stmt = mysqli_prepare($conn, $update_query);
            mysqli_stmt_bind_param($update_stmt, "is", $computer_id, $lab);
            mysqli_stmt_execute($update_stmt);
            
            break;
        }
    }
}

// Check for approved reservations for today in this lab
$today = date('Y-m-d');
$reservation_query = "SELECT computer FROM reservations 
                     WHERE room = ? AND date = ? AND status = 'approved'";
$stmt = mysqli_prepare($conn, $reservation_query);
mysqli_stmt_bind_param($stmt, "ss", $lab, $today);
mysqli_stmt_execute($stmt);
$reservation_result = mysqli_stmt_get_result($stmt);

// Mark computers as reserved based on approved reservations
while ($row = mysqli_fetch_assoc($reservation_result)) {
    $computer_id = $row['computer'];
    
    // Skip if null
    if (!$computer_id) continue;
    
    // Find this computer in our array and mark it as reserved if not occupied
    foreach ($computers as &$computer) {
        if ($computer['id'] == $computer_id && $computer['status'] != 'occupied') {
            $computer['status'] = 'reserved';
            
            // Also update the database
            $update_query = "UPDATE lab_computers SET status = 'reserved' 
                            WHERE computer_number = ? AND lab_id = ? AND status != 'occupied'";
            $update_stmt = mysqli_prepare($conn, $update_query);
            mysqli_stmt_bind_param($update_stmt, "is", $computer_id, $lab);
            mysqli_stmt_execute($update_stmt);
            
            break;
        }
    }
}

// Return the result as JSON
header('Content-Type: application/json');
echo json_encode($computers);
?> 