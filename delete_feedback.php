<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || $_SESSION['is_admin'] != 1) {
    header("Location: index.php");
    exit();
}

include("database.php");

if (isset($_GET['id'])) {
    $id = mysqli_real_escape_string($conn, $_GET['id']);
    
    // Delete the feedback
    $query = "DELETE FROM feedback WHERE id = '$id'";
    
    if (mysqli_query($conn, $query)) {
        $_SESSION['message'] = "Feedback deleted successfully!";
    } else {
        $_SESSION['message'] = "Error deleting feedback: " . mysqli_error($conn);
    }
}

// Redirect back to the feedback reports section
header("Location: homepage.php#feedback-reports");
exit();
?> 