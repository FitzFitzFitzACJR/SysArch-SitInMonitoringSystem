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
    $posted_by = $_SESSION['idno'];

    $query = "INSERT INTO announcements (title, content, posted_by) VALUES ('$title', '$content', '$posted_by')";
    
    if (mysqli_query($conn, $query)) {
        $_SESSION['message'] = "Announcement posted successfully!";
    } else {
        $_SESSION['message'] = "Error posting announcement: " . mysqli_error($conn);
    }
    
    header("Location: homepage.php");
    exit();
}
?> 