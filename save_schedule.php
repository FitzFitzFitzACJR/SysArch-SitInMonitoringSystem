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

// Get form data
$action = isset($_POST['action']) ? $_POST['action'] : 'add';
$schedule_id = isset($_POST['schedule_id']) ? mysqli_real_escape_string($conn, $_POST['schedule_id']) : null;
$room = mysqli_real_escape_string($conn, $_POST['room']);
$day_of_week = mysqli_real_escape_string($conn, $_POST['day_of_week']);
$time_slot = mysqli_real_escape_string($conn, $_POST['time_slot']);
$course_code = mysqli_real_escape_string($conn, $_POST['course_code']);
$instructor = mysqli_real_escape_string($conn, $_POST['instructor']);

// Validate required fields
if (empty($room) || empty($day_of_week) || empty($time_slot) || empty($course_code) || empty($instructor)) {
    echo "All fields are required";
    exit();
}

// Perform database operation based on action
if ($action === 'add') {
    // Insert new schedule
    $query = "INSERT INTO lab_schedules (room, day_of_week, time_slot, course_code, instructor) 
              VALUES ('$room', '$day_of_week', '$time_slot', '$course_code', '$instructor')";
    
    $result = mysqli_query($conn, $query);
    
    if ($result) {
        echo "success: Schedule added successfully";
    } else {
        echo "Error: " . mysqli_error($conn);
    }
} elseif ($action === 'update' && !empty($schedule_id)) {
    // Update existing schedule
    $query = "UPDATE lab_schedules 
              SET room = '$room', day_of_week = '$day_of_week', time_slot = '$time_slot', 
                  course_code = '$course_code', instructor = '$instructor', 
                  updated_at = CURRENT_TIMESTAMP 
              WHERE id = '$schedule_id'";
    
    $result = mysqli_query($conn, $query);
    
    if ($result) {
        echo "success: Schedule updated successfully";
    } else {
        echo "Error: " . mysqli_error($conn);
    }
} else {
    echo "Invalid action";
}
?> 