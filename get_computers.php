<?php
session_start();
include("database.php");

// Check if user is authenticated and is admin
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

// Get lab ID from request
$lab_id = isset($_GET['lab']) ? $_GET['lab'] : null;

if (!$lab_id) {
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
    
    // Initialize computers for all labs - 50 computers per lab
    $labs = ['524', '526', '528', '530', '547', 'MAC'];
    $computer_count = 50; // Fixed at 50 per lab
    
    foreach ($labs as $lab) {
        for ($i = 1; $i <= $computer_count; $i++) {
            $insert_query = "INSERT INTO lab_computers (computer_number, lab_id) VALUES ($i, '$lab')";
            mysqli_query($conn, $insert_query);
        }
    }
}

// Get active sit-in sessions for this lab to update occupied computers
$active_sessions_query = "SELECT * FROM sit_in_sessions WHERE laboratory = '$lab_id' AND status = 'active'";
$active_sessions_result = mysqli_query($conn, $active_sessions_query);

if ($active_sessions_result && mysqli_num_rows($active_sessions_result) > 0) {
    while ($session = mysqli_fetch_assoc($active_sessions_result)) {
        if (isset($session['computer_id']) && $session['computer_id']) {
            // Update computer status to occupied
            $update_query = "UPDATE lab_computers 
                            SET status = 'occupied' 
                            WHERE computer_number = '{$session['computer_id']}' 
                            AND lab_id = '$lab_id'";
            mysqli_query($conn, $update_query);
        }
    }
}

// Get current reservations for this lab to update reserved computers
$current_date = date('Y-m-d');
$reservations_query = "SELECT * FROM reservations 
                      WHERE room = '$lab_id' 
                      AND date = '$current_date' 
                      AND status = 'approved'";
$reservations_result = mysqli_query($conn, $reservations_query);

if ($reservations_result && mysqli_num_rows($reservations_result) > 0) {
    while ($reservation = mysqli_fetch_assoc($reservations_result)) {
        if (isset($reservation['computer']) && $reservation['computer']) {
            // Check if computer is already occupied
            $check_query = "SELECT status FROM lab_computers 
                            WHERE computer_number = '{$reservation['computer']}' 
                            AND lab_id = '$lab_id'";
            $check_result = mysqli_query($conn, $check_query);
            
            if ($check_result && mysqli_num_rows($check_result) > 0) {
                $computer_status = mysqli_fetch_assoc($check_result)['status'];
                
                // Only update to reserved if not already occupied
                if ($computer_status != 'occupied') {
                    $update_query = "UPDATE lab_computers 
                                    SET status = 'reserved' 
                                    WHERE computer_number = '{$reservation['computer']}' 
                                    AND lab_id = '$lab_id'";
                    mysqli_query($conn, $update_query);
                }
            }
        }
    }
}

// Fetch computers for the specified lab
$query = "SELECT * FROM lab_computers WHERE lab_id = ? ORDER BY computer_number";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "s", $lab_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

$computers = [];

// Create a map for existing computers
$existing_computers = [];
while ($row = mysqli_fetch_assoc($result)) {
    $existing_computers[$row['computer_number']] = [
        'id' => $row['computer_number'],
        'status' => $row['status'],
        'locked' => (bool)$row['locked']
    ];
}

// Ensure we return exactly 50 computers
for ($i = 1; $i <= 50; $i++) {
    if (isset($existing_computers[$i])) {
        $computers[] = $existing_computers[$i];
    } else {
        // Add missing computer with default values
        $insert_query = "INSERT INTO lab_computers (computer_number, lab_id) VALUES (?, ?)";
        $stmt = mysqli_prepare($conn, $insert_query);
        mysqli_stmt_bind_param($stmt, "is", $i, $lab_id);
        mysqli_stmt_execute($stmt);
        
        $computers[] = [
            'id' => $i,
            'status' => 'vacant',
            'locked' => false
        ];
    }
}

// Return the data as JSON
header('Content-Type: application/json');
echo json_encode($computers);
?> 