<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $title = mysqli_real_escape_string($conn, $_POST['title']);
    $description = mysqli_real_escape_string($conn, $_POST['description']);
    
    // Handle file upload
    if (isset($_FILES['resource_file']) && $_FILES['resource_file']['size'] > 0) {
        $target_dir = "uploads/resources/";
        
        // Create directory if it doesn't exist
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        
        // Generate unique filename
        $file_extension = strtolower(pathinfo($_FILES["resource_file"]["name"], PATHINFO_EXTENSION));
        $new_filename = uniqid() . '.' . $file_extension;
        $target_file = $target_dir . $new_filename;
        
        // Upload file
        if (move_uploaded_file($_FILES["resource_file"]["tmp_name"], $target_file)) {
            $link = $target_file; // Store the file path in the database
    
    // Insert the resource
    $query = "INSERT INTO lab_resources (title, link, description, status) 
              VALUES ('$title', '$link', '$description', 'active')";
    
    if (mysqli_query($conn, $query)) {
        $_SESSION['message'] = "Resource added successfully!";
    } else {
        $_SESSION['message'] = "Error adding resource: " . mysqli_error($conn);
            }
        } else {
            $_SESSION['message'] = "Sorry, there was an error uploading your file.";
        }
    } else {
        $_SESSION['message'] = "Please upload a file.";
    }
}

// Return to the lab resources section
header("Location: homepage.php#lab-resources");
exit();
?> 