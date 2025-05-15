<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if (isset($_GET['id'])) {
    $id = mysqli_real_escape_string($conn, $_GET['id']);
    
    // Delete the announcement
    $query = "DELETE FROM announcements WHERE id = '$id'";
    
    if (mysqli_query($conn, $query)) {
        $_SESSION['message'] = "Announcement deleted successfully!";
    } else {
        $_SESSION['message'] = "Error deleting announcement: " . mysqli_error($conn);
    }
}

// Return to the home section
header("Location: homepage.php#home");
exit();
?> 