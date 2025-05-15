<?php
session_start();
include("database.php");

// Check if user is logged in and is an admin
if (!isset($_SESSION['idno']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    $_SESSION['message'] = "You do not have permission to perform this action.";
    header("Location: homepage.php");
    exit();
}

// Check if feedback ID is provided
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $feedback_id = mysqli_real_escape_string($conn, $_GET['id']);
    
    // Update feedback status to read
    $query = "UPDATE student_feedback SET status = 'read' WHERE id = '$feedback_id'";
    
    if (mysqli_query($conn, $query)) {
        $_SESSION['message'] = "Feedback marked as read.";
    } else {
        $_SESSION['message'] = "Error marking feedback as read: " . mysqli_error($conn);
    }
} else {
    $_SESSION['message'] = "Invalid feedback ID.";
}

// Redirect back to feedback reports section
header("Location: homepage.php#feedback-reports");
exit();
?> 