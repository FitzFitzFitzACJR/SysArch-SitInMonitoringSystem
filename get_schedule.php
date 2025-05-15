<?php
session_start();
include("database.php");

// Check if user is logged in and is admin
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    echo json_encode(['error' => 'Unauthorized access']);
    exit();
}

// Get schedule ID from request
if (!isset($_GET['id']) || empty($_GET['id'])) {
    echo json_encode(['error' => 'No schedule ID provided']);
    exit();
}

$schedule_id = mysqli_real_escape_string($conn, $_GET['id']);

// Query the database to get schedule details
$query = "SELECT * FROM lab_schedules WHERE id = '$schedule_id'";
$result = mysqli_query($conn, $query);

if (!$result || mysqli_num_rows($result) == 0) {
    echo json_encode(['error' => 'Schedule not found']);
    exit();
}

// Return schedule data as JSON
$schedule = mysqli_fetch_assoc($result);
echo json_encode($schedule);
?> 