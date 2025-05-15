<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

// Reset all student sessions to 10
$query = "UPDATE users SET remaining_sessions = 10 WHERE idno != '00'";

if (mysqli_query($conn, $query)) {
    $_SESSION['message'] = "All student sessions have been reset to 10!";
} else {
    $_SESSION['message'] = "Error resetting sessions: " . mysqli_error($conn);
}

header("Location: homepage.php");
exit();
?> 