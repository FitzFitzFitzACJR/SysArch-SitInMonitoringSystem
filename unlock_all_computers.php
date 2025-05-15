<?php
session_start();
include("database.php");

// Check if user is authenticated and is admin
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

// Get POST parameters
$lab = isset($_POST['lab']) ? $_POST['lab'] : null;
$mode = isset($_POST['mode']) ? $_POST['mode'] : 'unlock'; // 'lock' or 'unlock'

// Validate inputs
if (!$lab) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Lab ID is required']);
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
        echo json_encode(['success' => false, 'message' => 'Failed to create lab_computers table: ' . mysqli_error($conn)]);
        exit;
    }
}

if ($mode == 'lock') {
    // Lock all computers in this lab, but don't lock computers that are currently in use
    $update_query = "UPDATE lab_computers SET locked = 1 
                    WHERE lab_id = ? AND status != 'occupied'";
    
    $stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($stmt, "s", $lab);
    
    if (!mysqli_stmt_execute($stmt)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to lock computers: ' . mysqli_error($conn)]);
        exit;
    }
    
    // Get the number of affected rows
    $locked_count = mysqli_stmt_affected_rows($stmt);
    
    echo json_encode([
        'success' => true, 
        'message' => "Successfully locked $locked_count computers in Lab $lab",
        'count' => $locked_count,
        'mode' => 'locked'
    ]);
} else {
    // Unlock all computers in this lab
    $update_query = "UPDATE lab_computers SET locked = 0 WHERE lab_id = ?";
    
    $stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($stmt, "s", $lab);
    
    if (!mysqli_stmt_execute($stmt)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to unlock computers: ' . mysqli_error($conn)]);
        exit;
    }
    
    // Get the number of affected rows
    $unlocked_count = mysqli_stmt_affected_rows($stmt);
    
    echo json_encode([
        'success' => true, 
        'message' => "Successfully unlocked $unlocked_count computers in Lab $lab",
        'count' => $unlocked_count,
        'mode' => 'unlocked'
    ]);
}
?> 