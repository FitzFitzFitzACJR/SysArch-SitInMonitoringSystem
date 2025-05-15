<?php
session_start();
include("database.php");

// Check if user is logged in
if (!isset($_SESSION['user'])) {
    session_destroy();
    header("Location: index.php");
    exit();
}

// Check if the form was submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get the submitted form data
    $student_id = $_SESSION['idno'];
    $reservation_date = mysqli_real_escape_string($conn, $_POST['reservation_date']);
    $reservation_time = mysqli_real_escape_string($conn, $_POST['reservation_time']);
    $room = mysqli_real_escape_string($conn, $_POST['room']);
    $purpose = mysqli_real_escape_string($conn, $_POST['purpose']);
    
    // Validate the data
    if (empty($reservation_date) || empty($reservation_time) || empty($room) || empty($purpose)) {
        $_SESSION['message'] = "Please fill out all fields.";
        header("Location: homepage.php");
        exit();
    }
    
    // Check if the user has enough remaining sessions
    $query = "SELECT remaining_sessions FROM users WHERE idno = '$student_id'";
    $result = mysqli_query($conn, $query);
    $user = mysqli_fetch_assoc($result);
    
    if ($user['remaining_sessions'] <= 0) {
        $_SESSION['message'] = "You have no remaining sessions. Please contact an administrator.";
        header("Location: homepage.php");
        exit();
    }
    
    // Check if the requested time slot is available
    $check_query = "SELECT * FROM reservations 
                   WHERE room = '$room' 
                   AND reservation_date = '$reservation_date' 
                   AND reservation_time = '$reservation_time' 
                   AND status IN ('pending', 'approved')";
    $check_result = mysqli_query($conn, $check_query);
    
    if (mysqli_num_rows($check_result) > 0) {
        $_SESSION['message'] = "This time slot is already booked. Please choose another time.";
        header("Location: homepage.php");
        exit();
    }
    
    // Insert reservation into the database
    $query = "INSERT INTO reservations (student_id, reservation_date, reservation_time, room, purpose) 
              VALUES ('$student_id', '$reservation_date', '$reservation_time', '$room', '$purpose')";
    
    if (mysqli_query($conn, $query)) {
        // Create a notification for the admin
        $notificationTitle = "New Reservation Request";
        $notificationMessage = "A new reservation has been requested for $room on " . date('M d, Y', strtotime($reservation_date)) . " at " . date('h:i A', strtotime($reservation_time)) . ".";
        
        $adminQuery = "INSERT INTO notifications (student_id, title, message) 
                       VALUES ('00', '$notificationTitle', '$notificationMessage')";
        mysqli_query($conn, $adminQuery);
        
        // Create a notification for the student
        $studentNotificationTitle = "Reservation Submitted";
        $studentNotificationMessage = "Your reservation for $room on " . date('M d, Y', strtotime($reservation_date)) . " at " . date('h:i A', strtotime($reservation_time)) . " has been submitted and is pending approval.";
        
        $studentQuery = "INSERT INTO notifications (student_id, title, message) 
                         VALUES ('$student_id', '$studentNotificationTitle', '$studentNotificationMessage')";
        mysqli_query($conn, $studentQuery);
        
        $_SESSION['message'] = "Your reservation has been submitted and is pending approval.";
    } else {
        $_SESSION['message'] = "Error making reservation: " . mysqli_error($conn);
    }
    
    // Redirect back to the homepage
    header("Location: homepage.php");
    exit();
} else {
    // If the form wasn't submitted, redirect to the homepage
    header("Location: homepage.php");
    exit();
}
?> 