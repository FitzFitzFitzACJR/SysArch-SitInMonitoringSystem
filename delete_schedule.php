<?php
session_start();
include("database.php");

// Check if user is logged in and is admin
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    echo "Unauthorized access";
    exit();
}

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo "Invalid request method";
    exit();
}

// Get schedule ID from request
if (!isset($_POST['id']) || empty($_POST['id'])) {
    echo "No schedule ID provided";
    exit();
}

$schedule_id = mysqli_real_escape_string($conn, $_POST['id']);

// Query the database to delete the schedule
$query = "DELETE FROM lab_schedules WHERE id = '$schedule_id'";
$result = mysqli_query($conn, $query);

if ($result) {
    echo "success: Schedule deleted successfully";
} else {
    echo "Error: " . mysqli_error($conn);
}
?> 