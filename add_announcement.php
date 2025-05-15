<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $title = mysqli_real_escape_string($conn, $_POST['title']);
    $content = mysqli_real_escape_string($conn, $_POST['content']);
    $created_by = $_SESSION['idno'];
    
    // Check if announcements table exists
    $check_table = mysqli_query($conn, "SHOW TABLES LIKE 'announcements'");
    if (mysqli_num_rows($check_table) == 0) {
        // Create the announcements table
        $create_table = "CREATE TABLE announcements (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(100),
            content TEXT,
            date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            posted_by VARCHAR(20),
            status ENUM('active', 'inactive') DEFAULT 'active'
        )";
        mysqli_query($conn, $create_table);
    }
    
    // Insert the announcement
    $query = "INSERT INTO announcements (title, content, posted_by) VALUES ('$title', '$content', '$created_by')";
    
    if (mysqli_query($conn, $query)) {
        $_SESSION['message'] = "Announcement posted successfully!";
    } else {
        $_SESSION['message'] = "Error posting announcement: " . mysqli_error($conn);
    }
    
    header("Location: homepage.php#home");
    exit();
}
?> 