<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if (isset($_GET['id'])) {
    $idno = mysqli_real_escape_string($conn, $_GET['id']);
    
    // Delete student
    $query = "DELETE FROM users WHERE idno = '$idno' AND idno != '00'";
    
    if (mysqli_query($conn, $query)) {
        $_SESSION['message'] = "Student deleted successfully!";
    } else {
        $_SESSION['message'] = "Error deleting student: " . mysqli_error($conn);
    }
}

header("Location: homepage.php");
exit();
?> 