<?php
session_start();
include("database.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['login'])) {
        $idno = mysqli_real_escape_string($conn, $_POST['idno']);
        $password = $_POST['password'];

        $query = "SELECT * FROM users WHERE idno='$idno'";
        $result = mysqli_query($conn, $query);

        if (!$result) {
            die("Database query failed: " . mysqli_error($conn));
        }

        if (mysqli_num_rows($result) > 0) {
            $user = mysqli_fetch_assoc($result);

            if (password_verify($password, $user['password'])) {
                // Store user data in session
                $_SESSION['user'] = $user['firstname'];
                $_SESSION['idno'] = $user['idno']; // Store idno in session
                $_SESSION['is_admin'] = ($user['idno'] == '00'); // Check if the user is admin
                header("Location: homepage.php");
                exit();
            } else {
                echo "<script>alert('Incorrect password!');</script>";
            }
        } else {
            echo "<script>alert('User not found! Please register.');</script>";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CCS SIT-IN MONITORING SYSTEM</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <div class="header">
        <img src="logo ccs.png" class="logo" alt="Logo">
        <h1>CCS SIT-IN MONITORING SYSTEM</h1>
    </div>

    <div class="container">
        <h2>Login</h2>
        <form action="index.php" method="post">
            <label for="idno">ID Number:</label>
            <input type="text" name="idno" required>

            <label for="password">Password:</label>
            <input type="password" name="password" placeholder="Enter your password" required>

            <input type="submit" name="login" value="Login">
        </form>
        <p>Don't have an account? <a href="register.php">Register here</a></p>
    </div>

</body>
</html>
