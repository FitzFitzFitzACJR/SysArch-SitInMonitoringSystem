<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if (isset($_GET['id'])) {
    $session_id = mysqli_real_escape_string($conn, $_GET['id']);
    
    // Get session info
    $query = "SELECT * FROM sit_in_sessions WHERE id = '$session_id' AND status = 'active'";
    $result = mysqli_query($conn, $query);
    
    if (mysqli_num_rows($result) > 0) {
        $session = mysqli_fetch_assoc($result);
        $student_id = $session['student_id'];
        $start_time = strtotime($session['session_start']);
        $end_time = time();
        $duration = round(($end_time - $start_time) / 60); // Calculate duration in minutes
        $end_datetime = date('Y-m-d H:i:s', $end_time);
        
        // Update session status
        $update_query = "UPDATE sit_in_sessions SET 
                        session_end = '$end_datetime', 
                        status = 'completed', 
                        duration = '$duration' 
                        WHERE id = '$session_id'";
        
        if (mysqli_query($conn, $update_query)) {
            // Also update the sit_in_records table for consistency
            $update_records_query = "UPDATE sit_in_records SET 
                               session_end = '$end_datetime', 
                               status = 'completed', 
                               duration = '$duration' 
                               WHERE session_id = '$session_id'";
            mysqli_query($conn, $update_records_query);
            
            $_SESSION['message'] = "Session ended successfully without adding behavior points.";
        } else {
            $_SESSION['message'] = "Error ending session: " . mysqli_error($conn);
        }
    } else {
        $_SESSION['message'] = "Session not found or already completed.";
    }
}

// Redirect to current sit-in sessions page
$redirect = isset($_GET['redirect']) ? $_GET['redirect'] : 'current-sit-in';

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