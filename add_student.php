<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $idno = mysqli_real_escape_string($conn, $_POST['idno']);
    $firstname = mysqli_real_escape_string($conn, $_POST['firstname']);
    $midname = mysqli_real_escape_string($conn, $_POST['midname']);
    $lastname = mysqli_real_escape_string($conn, $_POST['lastname']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $course = mysqli_real_escape_string($conn, $_POST['course']);
    $yearlvl = mysqli_real_escape_string($conn, $_POST['yearlvl']);
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Check if ID number already exists
    $check_query = "SELECT * FROM users WHERE idno = '$idno'";
    $check_result = mysqli_query($conn, $check_query);

    if (mysqli_num_rows($check_result) > 0) {
        $_SESSION['message'] = "Error: ID number already exists!";
    } else {
        // Insert new student
        $query = "INSERT INTO users (idno, firstname, midname, lastname, email, course, yearlvl, password, remaining_sessions) 
                  VALUES ('$idno', '$firstname', '$midname', '$lastname', '$email', '$course', '$yearlvl', '$password', 10)";
        
        if (mysqli_query($conn, $query)) {
            $_SESSION['message'] = "Student added successfully!";
        } else {
            $_SESSION['message'] = "Error adding student: " . mysqli_error($conn);
        }
    }
}

header("Location: homepage.php");
exit();
?> 