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
$computer_id = isset($_POST['computer_id']) ? intval($_POST['computer_id']) : null;
$lab_id = isset($_POST['lab_id']) ? $_POST['lab_id'] : null;

// Log the request for debugging
error_log("Toggle request: Computer ID: $computer_id, Lab ID: $lab_id");

// Validate inputs
if (!$computer_id || !$lab_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Computer ID and Lab ID are required']);
    exit;
}

// Check if the computer exists
$check_query = "SELECT * FROM lab_computers WHERE computer_number = ? AND lab_id = ?";
$stmt = mysqli_prepare($conn, $check_query);
mysqli_stmt_bind_param($stmt, "is", $computer_id, $lab_id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($result) == 0) {
    // Computer doesn't exist, create it
    $insert_query = "INSERT INTO lab_computers (computer_number, lab_id, locked) VALUES (?, ?, 1)";
    $stmt = mysqli_prepare($conn, $insert_query);
    mysqli_stmt_bind_param($stmt, "is", $computer_id, $lab_id);
    
    if (!mysqli_stmt_execute($stmt)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create computer entry: ' . mysqli_error($conn)]);
        exit;
    }
    
    echo json_encode(['success' => true, 'message' => 'Computer locked successfully']);
    exit;
}

$computer = mysqli_fetch_assoc($result);

// Log the current computer state
error_log("Current computer state: " . json_encode($computer));

// Check if the computer is currently in use (occupied)
if ($computer['status'] == 'occupied' && !$computer['locked']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Cannot lock computer that is currently in use']);
    exit;
}

// Toggle the locked status
$new_locked_status = $computer['locked'] ? 0 : 1;

// Log the change
error_log("Changing lock status from {$computer['locked']} to $new_locked_status");

// Update the computer status
$update_query = "UPDATE lab_computers SET locked = ? WHERE computer_number = ? AND lab_id = ?";
$stmt = mysqli_prepare($conn, $update_query);
mysqli_stmt_bind_param($stmt, "iis", $new_locked_status, $computer_id, $lab_id);

if (mysqli_stmt_execute($stmt)) {
    // If we're locking the computer and it was reserved, cancel the reservation
    if ($new_locked_status && $computer['status'] == 'reserved') {
        $update_status = "UPDATE lab_computers SET status = 'vacant' WHERE computer_number = ? AND lab_id = ?";
        $stmt_status = mysqli_prepare($conn, $update_status);
        mysqli_stmt_bind_param($stmt_status, "is", $computer_id, $lab_id);
        mysqli_stmt_execute($stmt_status);
        
        // Update any reservations for this computer to "rejected"
        $update_reservations_query = "UPDATE reservations SET status = 'rejected', 
                                    response_time = NOW(), 
                                    admin_notes = 'Automatically rejected due to computer being locked'
                                    WHERE room = ? AND computer = ? AND status = 'approved'";
        $stmt = mysqli_prepare($conn, $update_reservations_query);
        mysqli_stmt_bind_param($stmt, "si", $lab_id, $computer_id);
        mysqli_stmt_execute($stmt);
        
        // Log this action
        error_log("Cancelled reservations for computer $computer_id in lab $lab_id due to locking");
    }
    
    $action = $new_locked_status ? 'locked' : 'unlocked';
    echo json_encode(['success' => true, 'message' => "Computer successfully $action", 'status' => $action]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update computer status: ' . mysqli_error($conn)]);
}
?> 