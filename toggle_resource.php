<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if (isset($_GET['id']) && isset($_GET['action'])) {
    $id = mysqli_real_escape_string($conn, $_GET['id']);
    $action = mysqli_real_escape_string($conn, $_GET['action']);
    
    $status = ($action == 'activate') ? 'active' : 'inactive';
    
    // Update resource status
    $query = "UPDATE lab_resources SET status = '$status' WHERE id = '$id'";
    
    if (mysqli_query($conn, $query)) {
        $_SESSION['message'] = "Resource " . ($action == 'activate' ? 'activated' : 'deactivated') . " successfully!";
    } else {
        $_SESSION['message'] = "Error updating resource: " . mysqli_error($conn);
    }
}

// Return to the lab resources section
header("Location: homepage.php#lab-resources");
exit();
?> 