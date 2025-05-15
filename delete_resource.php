<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if (isset($_GET['id'])) {
    $id = mysqli_real_escape_string($conn, $_GET['id']);
    
    // Delete the resource
    $query = "DELETE FROM lab_resources WHERE id = '$id'";
    
    if (mysqli_query($conn, $query)) {
        $_SESSION['message'] = "Resource deleted successfully!";
    } else {
        $_SESSION['message'] = "Error deleting resource: " . mysqli_error($conn);
    }
}

// Return to the lab resources section
header("Location: homepage.php#lab-resources");
exit();
?> 