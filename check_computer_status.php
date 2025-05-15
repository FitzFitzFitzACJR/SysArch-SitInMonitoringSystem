<?php
// Include database connection
include_once("database.php");

/**
 * Check if a computer is available for use
 * 
 * @param int $computer_number The computer number to check
 * @param string $lab_id The lab ID where the computer is located
 * @return array Status information about the computer
 */
function checkComputerAvailability($computer_number, $lab_id) {
    global $conn;
    
    // Create lab_computers table if it doesn't exist
    $check_table_query = "SHOW TABLES LIKE 'lab_computers'";
    $table_exists = mysqli_query($conn, $check_table_query);
    
    if (mysqli_num_rows($table_exists) == 0) {
        // Table doesn't exist, return default available status
        return [
            'available' => true,
            'status' => 'vacant',
            'message' => 'Computer available'
        ];
    }
    
    // Check if the computer exists and get its status
    $query = "SELECT * FROM lab_computers WHERE computer_number = ? AND lab_id = ?";
    $stmt = mysqli_prepare($conn, $query);
    
    if (!$stmt) {
        return [
            'available' => false,
            'status' => 'error',
            'message' => 'Database error: ' . mysqli_error($conn)
        ];
    }
    
    mysqli_stmt_bind_param($stmt, "is", $computer_number, $lab_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    if (mysqli_num_rows($result) == 0) {
        // Computer not found in the system, assume it's available
        return [
            'available' => true,
            'status' => 'vacant',
            'message' => 'Computer available'
        ];
    }
    
    $computer = mysqli_fetch_assoc($result);
    
    // Check if the computer is locked
    if ($computer['locked']) {
        return [
            'available' => false,
            'status' => 'locked',
            'message' => 'This computer is locked by the administrator'
        ];
    }
    
    // Check if the computer is occupied
    if ($computer['status'] == 'occupied') {
        return [
            'available' => false,
            'status' => 'occupied',
            'message' => 'This computer is currently in use'
        ];
    }
    
    // Check if the computer is reserved
    if ($computer['status'] == 'reserved') {
        return [
            'available' => false,
            'status' => 'reserved',
            'message' => 'This computer is currently reserved'
        ];
    }
    
    // Computer is available
    return [
        'available' => true,
        'status' => 'vacant',
        'message' => 'Computer available'
    ];
}

/**
 * Mark a computer as occupied
 * 
 * @param int $computer_number The computer number to mark
 * @param string $lab_id The lab ID where the computer is located
 * @return bool Whether the operation was successful
 */
function markComputerOccupied($computer_number, $lab_id) {
    global $conn;
    
    // Check if the lab_computers table exists
    $check_table_query = "SHOW TABLES LIKE 'lab_computers'";
    $table_exists = mysqli_query($conn, $check_table_query);
    
    if (mysqli_num_rows($table_exists) == 0) {
        // Table doesn't exist - create it with this computer marked as occupied
        return createComputerEntry($computer_number, $lab_id, 'occupied');
    }
    
    // Check if the computer exists
    $query = "SELECT * FROM lab_computers WHERE computer_number = ? AND lab_id = ?";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "is", $computer_number, $lab_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    if (mysqli_num_rows($result) == 0) {
        // Computer doesn't exist - create it
        return createComputerEntry($computer_number, $lab_id, 'occupied');
    }
    
    // Computer exists - update its status
    $update_query = "UPDATE lab_computers SET status = 'occupied' WHERE computer_number = ? AND lab_id = ?";
    $stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($stmt, "is", $computer_number, $lab_id);
    return mysqli_stmt_execute($stmt);
}

/**
 * Mark a computer as reserved
 * 
 * @param int $computer_number The computer number to mark
 * @param string $lab_id The lab ID where the computer is located
 * @return bool Whether the operation was successful
 */
function markComputerReserved($computer_number, $lab_id) {
    global $conn;
    
    // Check if the lab_computers table exists
    $check_table_query = "SHOW TABLES LIKE 'lab_computers'";
    $table_exists = mysqli_query($conn, $check_table_query);
    
    if (mysqli_num_rows($table_exists) == 0) {
        // Table doesn't exist - create it with this computer marked as reserved
        return createComputerEntry($computer_number, $lab_id, 'reserved');
    }
    
    // Check if the computer exists
    $query = "SELECT * FROM lab_computers WHERE computer_number = ? AND lab_id = ?";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "is", $computer_number, $lab_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    if (mysqli_num_rows($result) == 0) {
        // Computer doesn't exist - create it
        return createComputerEntry($computer_number, $lab_id, 'reserved');
    }
    
    // Computer exists - update its status
    $update_query = "UPDATE lab_computers SET status = 'reserved' WHERE computer_number = ? AND lab_id = ?";
    $stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($stmt, "is", $computer_number, $lab_id);
    return mysqli_stmt_execute($stmt);
}

/**
 * Mark a computer as vacant (available)
 * 
 * @param int $computer_number The computer number to mark
 * @param string $lab_id The lab ID where the computer is located
 * @return bool Whether the operation was successful
 */
function markComputerVacant($computer_number, $lab_id) {
    global $conn;
    
    // Check if the lab_computers table exists
    $check_table_query = "SHOW TABLES LIKE 'lab_computers'";
    $table_exists = mysqli_query($conn, $check_table_query);
    
    if (mysqli_num_rows($table_exists) == 0) {
        // Table doesn't exist - no need to mark as vacant
        return true;
    }
    
    // Check if the computer exists
    $query = "SELECT * FROM lab_computers WHERE computer_number = ? AND lab_id = ?";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "is", $computer_number, $lab_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    if (mysqli_num_rows($result) == 0) {
        // Computer doesn't exist - no need to mark as vacant
        return true;
    }
    
    // Computer exists - update its status
    $update_query = "UPDATE lab_computers SET status = 'vacant' WHERE computer_number = ? AND lab_id = ?";
    $stmt = mysqli_prepare($conn, $update_query);
    mysqli_stmt_bind_param($stmt, "is", $computer_number, $lab_id);
    return mysqli_stmt_execute($stmt);
}

/**
 * Helper function to create a new computer entry
 */
function createComputerEntry($computer_number, $lab_id, $status = 'vacant') {
    global $conn;
    
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
            return false;
        }
    }
    
    // Insert the new computer entry
    $insert_query = "INSERT INTO lab_computers (computer_number, lab_id, status) 
                     VALUES (?, ?, ?) 
                     ON DUPLICATE KEY UPDATE status = VALUES(status)";
    
    $stmt = mysqli_prepare($conn, $insert_query);
    mysqli_stmt_bind_param($stmt, "iss", $computer_number, $lab_id, $status);
    return mysqli_stmt_execute($stmt);
}
?> 