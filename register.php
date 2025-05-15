<?php
include("database.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $idno = mysqli_real_escape_string($conn, $_POST['idno']);
    $lastname = mysqli_real_escape_string($conn, $_POST['lastname']);
    $firstname = mysqli_real_escape_string($conn, $_POST['firstname']);
    $midname = mysqli_real_escape_string($conn, $_POST['midname']);
    $course = mysqli_real_escape_string($conn, $_POST['course']);
    $yearlvl = $_POST['yearlvl']; 
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

   
    if (!in_array($yearlvl, ['1', '2', '3', '4'])) {
        echo "<script>alert('Invalid Year Level! Please select between 1st and 4th Year.'); window.history.back();</script>";
        exit();
    }

    
    $check_email = "SELECT * FROM users WHERE email='$email'";
    $result = mysqli_query($conn, $check_email);

    if (mysqli_num_rows($result) > 0) {
        echo "<script>alert('Email already registered! Try another.');</script>";
    } else {
       
        $query = "INSERT INTO users (idno, lastname, firstname, midname, course, yearlvl, email, password) 
                  VALUES ('$idno', '$lastname', '$firstname', '$midname', '$course', '$yearlvl', '$email', '$password')";
        
        if (mysqli_query($conn, $query)) {
            echo "<script>alert('Registration successful! You can now log in.'); window.location='index.php';</script>";
        } else {
            echo "<script>alert('Error: " . mysqli_error($conn) . "');</script>";
        }
    }
}
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h2>Register</h2>
        <form action="" method="post">
            <label>ID No:</label>
            <input type="text" name="idno" required>
            <label>Last Name:</label>
            <input type="text" name="lastname" required>
            <label>First Name:</label>
            <input type="text" name="firstname" required>
            <label>Middle Name:</label>
            <input type="text" name="midname">
            <label>Course:</label>
            <select name="course" required>
            <option value="">Select Course</option>
            <option value="1">Bachelor of Science in Information Technology</option>
            <option value="2">Bachelor of Science in Accountancy</option>
            <option value="3">Bachelor of Science in Computer Science</option>
            <option value="4">Bachelor of Science in Criminology</option>
            </select>
            <label>Year Level:</label>
            <select name="yearlvl" required>
            <option value="">Select Year Level</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            </select>
            <label>Email:</label>
            <input type="email" name="email" required>
            <label>Password:</label>
            <input type="password" name="password" required>
            <input type="submit" value="Register">
        </form>
        <p>Already have an account? <a href="index.php">Login here</a></p>
    </div>
</body>
</html>
