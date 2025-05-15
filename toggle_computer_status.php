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
$computer = isset($_POST['computer']) ? intval($_POST['computer']) : null;

// Validate inputs
if (!$lab || !$computer) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Lab and computer IDs are required']);
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
    
    // Insert this computer
    $insert_query = "INSERT INTO lab_computers (computer_number, lab_id, locked) VALUES (?, ?, 1)";
    $stmt = mysqli_prepare($conn, $insert_query);
    mysqli_stmt_bind_param($stmt, "is", $computer, $lab);
    
    if (!mysqli_stmt_execute($stmt)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create computer entry: ' . mysqli_error($conn)]);
        exit;
    }
    
    echo json_encode(['success' => true, 'message' => 'Computer locked successfully']);
    exit;
}

// Check if the computer exists
$query = "SELECT * FROM lab_computers WHERE computer_number = ? AND lab_id = ?";
$stmt = mysqli_prepare($conn, $query);
mysqli_stmt_bind_param($stmt, "is", $computer, $lab);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) == 0) {
    // Computer doesn't exist, create it
    $insert_query = "INSERT INTO lab_computers (computer_number, lab_id, locked) VALUES (?, ?, 1)";
    $stmt = mysqli_prepare($conn, $insert_query);
    mysqli_stmt_bind_param($stmt, "is", $computer, $lab);
    
    if (!mysqli_stmt_execute($stmt)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create computer entry: ' . mysqli_error($conn)]);
        exit;
    }
    
    echo json_encode(['success' => true, 'message' => 'Computer locked successfully']);
    exit;
}

// Get the current computer status
$computer_data = mysqli_fetch_assoc($result);

// Toggle the lock status
$new_locked_status = $computer_data['locked'] ? 0 : 1;

// If the computer is occupied and we're trying to lock it, prevent this action
if ($computer_data['status'] == 'occupied' && $new_locked_status == 1) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Cannot lock a computer that is currently in use']);
    exit;
}

// Update the lock status
$update_query = "UPDATE lab_computers SET locked = ? WHERE computer_number = ? AND lab_id = ?";
$stmt = mysqli_prepare($conn, $update_query);
mysqli_stmt_bind_param($stmt, "iis", $new_locked_status, $computer, $lab);

if (!mysqli_stmt_execute($stmt)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update computer status: ' . mysqli_error($conn)]);
    exit;
}

// If we locked a computer that was reserved, cancel the reservation
if ($new_locked_status == 1 && $computer_data['status'] == 'reserved') {
    $update_status_query = "UPDATE lab_computers SET status = 'vacant' WHERE computer_number = ? AND lab_id = ?";
    $stmt = mysqli_prepare($conn, $update_status_query);
    mysqli_stmt_bind_param($stmt, "is", $computer, $lab);
    mysqli_stmt_execute($stmt);
    
    // Additionally, update any reservations for this computer to "cancelled"
    $update_reservations_query = "UPDATE reservations SET status = 'cancelled' 
                                 WHERE room = ? AND computer = ? AND status = 'approved'";
    $stmt = mysqli_prepare($conn, $update_reservations_query);
    mysqli_stmt_bind_param($stmt, "si", $lab, $computer);
    mysqli_stmt_execute($stmt);
}

$status = $new_locked_status ? 'locked' : 'unlocked';
echo json_encode(['success' => true, 'message' => "Computer successfully $status"]);
?> 