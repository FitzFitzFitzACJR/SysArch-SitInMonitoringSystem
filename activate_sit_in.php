<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $student_id = mysqli_real_escape_string($conn, $_POST['student_id']);
    $purpose = mysqli_real_escape_string($conn, $_POST['purpose']);
    $laboratory = mysqli_real_escape_string($conn, $_POST['laboratory']);
    $computer_id = isset($_POST['computer_id']) ? mysqli_real_escape_string($conn, $_POST['computer_id']) : null;
    
    // Check if student has remaining sessions
    $check_sessions = "SELECT remaining_sessions FROM users WHERE idno = '$student_id'";
    $sessions_result = mysqli_query($conn, $check_sessions);
    $sessions = mysqli_fetch_assoc($sessions_result);
    
    if ($sessions['remaining_sessions'] <= 0) {
        $_SESSION['message'] = "Error: Student has no remaining sessions.";
        header("Location: homepage.php#students");
        exit();
    }
    
    // Check if student already has an active session
    $check_active = "SELECT * FROM sit_in_sessions WHERE student_id = '$student_id' AND status = 'active'";
    $active_result = mysqli_query($conn, $check_active);
    
    if (mysqli_num_rows($active_result) > 0) {
        $_SESSION['message'] = "Error: Student already has an active sit-in session.";
        header("Location: homepage.php#students");
        exit();
    }
    
    // Deduct one session from the student
    $update_sessions = "UPDATE users SET remaining_sessions = remaining_sessions - 1 WHERE idno = '$student_id'";
    mysqli_query($conn, $update_sessions);
    
    // Insert new sit-in session
    $query = "INSERT INTO sit_in_sessions (student_id, purpose, laboratory, computer_id, status) 
              VALUES ('$student_id', '$purpose', '$laboratory', " . ($computer_id ? "'$computer_id'" : "NULL") . ", 'active')";
    
    if (mysqli_query($conn, $query)) {
        // Get the inserted session ID
        $session_id = mysqli_insert_id($conn);
        
        // Also insert into sit_in_records for consistency across different views
        $records_query = "INSERT INTO sit_in_records (student_id, session_id, purpose, laboratory, computer_id, status) 
                         VALUES ('$student_id', '$session_id', '$purpose', '$laboratory', " . ($computer_id ? "'$computer_id'" : "NULL") . ", 'active')";
        mysqli_query($conn, $records_query);
        
        // Update leaderboard
        $check_leaderboard = "SELECT * FROM attendance_leaderboard WHERE student_id = '$student_id'";
        $leaderboard_result = mysqli_query($conn, $check_leaderboard);
        
        if (mysqli_num_rows($leaderboard_result) > 0) {
            // Update existing record
            $update_leaderboard = "UPDATE attendance_leaderboard SET attendance_count = attendance_count + 1 WHERE student_id = '$student_id'";
            mysqli_query($conn, $update_leaderboard);
        } else {
            // Insert new record
            $insert_leaderboard = "INSERT INTO attendance_leaderboard (student_id, attendance_count) VALUES ('$student_id', 1)";
            mysqli_query($conn, $insert_leaderboard);
        }
        
        // Update the computer status in lab_computers table
        if ($computer_id) {
            // Check if entry exists in lab_computers
            $check_computer = "SELECT * FROM lab_computers WHERE computer_number = ? AND lab_id = ?";
            $stmt = mysqli_prepare($conn, $check_computer);
            mysqli_stmt_bind_param($stmt, "is", $computer_id, $laboratory);
            mysqli_stmt_execute($stmt);
            $computer_result = mysqli_stmt_get_result($stmt);
            
            if (mysqli_num_rows($computer_result) > 0) {
                // Update existing record
                $update_computer = "UPDATE lab_computers SET status = 'occupied', locked = 0 
                                   WHERE computer_number = ? AND lab_id = ?";
                $stmt = mysqli_prepare($conn, $update_computer);
                mysqli_stmt_bind_param($stmt, "is", $computer_id, $laboratory);
                mysqli_stmt_execute($stmt);
            } else {
                // Create new record
                $insert_computer = "INSERT INTO lab_computers (computer_number, lab_id, status, locked) 
                                  VALUES (?, ?, 'occupied', 0)";
                $stmt = mysqli_prepare($conn, $insert_computer);
                mysqli_stmt_bind_param($stmt, "is", $computer_id, $laboratory);
                mysqli_stmt_execute($stmt);
            }
        }
        
        $_SESSION['message'] = "Sit-in session activated successfully!";
    } else {
        $_SESSION['message'] = "Error activating sit-in session: " . mysqli_error($conn);
    }
}

// Redirect to current sit-in sessions page
$redirect = isset($_POST['redirect']) ? $_POST['redirect'] : 'current-sit-in';

// Handle different redirect options
if ($redirect === 'computer_control') {
    // Set a session flag to open Computer Control modal on page load
    $_SESSION['open_computer_control'] = true;
header("Location: homepage.php#current-sit-in");
} else {
    header("Location: homepage.php#$redirect");
}
exit();
?> 