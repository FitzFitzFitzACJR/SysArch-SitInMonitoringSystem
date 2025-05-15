<?php
session_start();
if (!isset($_SESSION['user'])) {
    session_destroy();
    header("Location: index.php");
    exit();
}

include("database.php");

// Get the user's ID number from the session
$idno = $_SESSION['idno'];

// Process the form submission
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $firstname = mysqli_real_escape_string($conn, $_POST['firstname']);
    $midname = mysqli_real_escape_string($conn, $_POST['midname']);
    $lastname = mysqli_real_escape_string($conn, $_POST['lastname']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $course = mysqli_real_escape_string($conn, $_POST['course']);
    $yearlvl = mysqli_real_escape_string($conn, $_POST['yearlvl']);

    // Start building the update query
    $updateFields = "firstname='$firstname', midname='$midname', lastname='$lastname', email='$email', course='$course', yearlvl='$yearlvl'";

    // Handle photo upload
    $photo = $_FILES['photo']['name'];
    $current_photo = $_POST['current_photo']; // Get current photo value
    
    // Only process photo upload if a new file was selected
    if (!empty($photo)) {
        $target_dir = "uploads/";
        
        // Create uploads directory if it doesn't exist
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        
        // Generate unique filename to prevent overwriting
        $file_extension = strtolower(pathinfo($photo, PATHINFO_EXTENSION));
        $new_filename = uniqid() . '.' . $file_extension;
        $target_file = $target_dir . $new_filename;
        
        // Check if image file is a actual image or fake image
        $check = getimagesize($_FILES["photo"]["tmp_name"]);
        if ($check === false) {
            $_SESSION['message'] = "File is not an image.";
            header("Location: homepage.php");
            exit();
        }

        // Check file size (500KB limit)
        if ($_FILES["photo"]["size"] > 500000) {
            $_SESSION['message'] = "Sorry, your file is too large.";
            header("Location: homepage.php");
            exit();
        }

        // Allow certain file formats
        if ($file_extension != "jpg" && $file_extension != "png" && $file_extension != "jpeg" && $file_extension != "gif") {
            $_SESSION['message'] = "Sorry, only JPG, JPEG, PNG & GIF files are allowed.";
            header("Location: homepage.php");
            exit();
        }

        // Upload file
        if (move_uploaded_file($_FILES["photo"]["tmp_name"], $target_file)) {
            // Delete old photo if it exists
            if (!empty($current_photo) && file_exists($target_dir . $current_photo)) {
                unlink($target_dir . $current_photo);
            }
            $updateFields .= ", photo='$new_filename'"; // Add photo to update fields
        } else {
            $_SESSION['message'] = "Sorry, there was an error uploading your file.";
            header("Location: homepage.php");
            exit();
        }
    }

    // Handle password update if provided
    if (!empty($_POST['password'])) {
        $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
        $updateFields .= ", password='$password'";
    }

    // Update user information in the database
    $query = "UPDATE users SET $updateFields WHERE idno='$idno'";
    if (mysqli_query($conn, $query)) {
        $_SESSION['message'] = "Profile updated successfully!";
        header("Location: homepage.php");
        exit();
    } else {
        echo "Error updating record: " . mysqli_error($conn);
    }
}
?>