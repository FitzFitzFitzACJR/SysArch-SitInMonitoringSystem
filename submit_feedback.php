<?php
session_start();
include("database.php");

// Check if user is logged in
if (!isset($_SESSION['idno'])) {
    $_SESSION['message'] = "You must be logged in to submit feedback.";
    header("Location: index.php");
    exit();
}

// Check if form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get form data
    $student_id = $_SESSION['idno'];
    $room = mysqli_real_escape_string($conn, $_POST['room']);
    $rating = mysqli_real_escape_string($conn, $_POST['rating']);
    $feedback_type = mysqli_real_escape_string($conn, $_POST['feedback_type']);
    $comments = mysqli_real_escape_string($conn, $_POST['comments']);
    $suggestions = isset($_POST['suggestions']) ? mysqli_real_escape_string($conn, $_POST['suggestions']) : '';
    
    // Create student_feedback table if it doesn't exist
    $create_table_query = "CREATE TABLE IF NOT EXISTS student_feedback (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        room VARCHAR(50) NOT NULL,
        rating INT(1) NOT NULL,
        feedback_type VARCHAR(50) NOT NULL,
        comments TEXT NOT NULL,
        suggestions TEXT,
        status ENUM('unread', 'read') DEFAULT 'unread',
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    if (!mysqli_query($conn, $create_table_query)) {
        $_SESSION['message'] = "Error creating feedback table: " . mysqli_error($conn);
        header("Location: homepage.php");
        exit();
    }
    
    // Insert feedback into database
    $insert_query = "INSERT INTO student_feedback (student_id, room, rating, feedback_type, comments, suggestions) 
                    VALUES ('$student_id', '$room', '$rating', '$feedback_type', '$comments', '$suggestions')";
    
    if (mysqli_query($conn, $insert_query)) {
        $_SESSION['message'] = "Feedback submitted successfully. Thank you for your input!";
    } else {
        $_SESSION['message'] = "Error submitting feedback: " . mysqli_error($conn);
    }
    
    // Redirect back to homepage
    header("Location: homepage.php");
    exit();
} else {
    // If not POST request, redirect to homepage
    header("Location: homepage.php");
    exit();
}
?> 