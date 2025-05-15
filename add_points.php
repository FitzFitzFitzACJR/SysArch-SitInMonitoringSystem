<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $student_id = mysqli_real_escape_string($conn, $_POST['student_id']);
    $points = mysqli_real_escape_string($conn, $_POST['points']);
    $reason = mysqli_real_escape_string($conn, $_POST['reason']);
    
    // Calculate additional sessions (each 3 points = 1 session)
    $sessions_added = floor($points / 3);
    
    // Update points and sessions for the student
    $update_query = "UPDATE users SET 
                    behavior_points = behavior_points + $points, 
                    remaining_sessions = remaining_sessions + $sessions_added
                    WHERE idno = '$student_id'";
    
    if (mysqli_query($conn, $update_query)) {
        // Log the points addition
        $admin_id = $_SESSION['idno'];
        $log_query = "INSERT INTO points_log (student_id, points_added, reason, sessions_added, added_by) 
                     VALUES ('$student_id', $points, '$reason', $sessions_added, '$admin_id')";
        mysqli_query($conn, $log_query);
        
        $_SESSION['message'] = "Added $points behavior points and $sessions_added additional sessions to the student successfully!";
    } else {
        $_SESSION['message'] = "Error adding points: " . mysqli_error($conn);
    }
    
    header("Location: homepage.php#students");
    exit();
}
?> 