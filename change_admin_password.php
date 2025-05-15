<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $current_password = $_POST['current_password'];
    $new_password = $_POST['new_password'];
    $confirm_password = $_POST['confirm_password'];
    
    // Validate that new password and confirm password match
    if ($new_password !== $confirm_password) {
        $_SESSION['message'] = "New password and confirm password do not match!";
        header("Location: homepage.php");
        exit();
    }
    
    // Get admin's current password from database
    $query = "SELECT password FROM users WHERE idno = '00'";
    $result = mysqli_query($conn, $query);
    $admin = mysqli_fetch_assoc($result);
    
    // Verify current password
    if (password_verify($current_password, $admin['password'])) {
        // Hash the new password
        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
        
        // Update admin password
        $update_query = "UPDATE users SET password = '$hashed_password' WHERE idno = '00'";
        
        if (mysqli_query($conn, $update_query)) {
            $_SESSION['message'] = "Admin password updated successfully!";
        } else {
            $_SESSION['message'] = "Error updating password: " . mysqli_error($conn);
        }
    } else {
        $_SESSION['message'] = "Current password is incorrect!";
    }
}

header("Location: homepage.php");
exit();
?> 