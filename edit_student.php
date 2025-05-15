<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

// Map course codes to full names
$courses = [
    1 => "BSIT",
    2 => "BSA",
    3 => "BSCS",
    4 => "BSCRIM"
];

if (isset($_GET['id'])) {
    $idno = mysqli_real_escape_string($conn, $_GET['id']);
    $query = "SELECT * FROM users WHERE idno = '$idno'";
    $result = mysqli_query($conn, $query);
    $student = mysqli_fetch_assoc($result);

    if (!$student) {
        $_SESSION['message'] = "Student not found!";
        header("Location: homepage.php");
        exit();
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $idno = mysqli_real_escape_string($conn, $_POST['idno']);
    $firstname = mysqli_real_escape_string($conn, $_POST['firstname']);
    $midname = mysqli_real_escape_string($conn, $_POST['midname']);
    $lastname = mysqli_real_escape_string($conn, $_POST['lastname']);
    $email = mysqli_real_escape_string($conn, $_POST['email']);
    $course = mysqli_real_escape_string($conn, $_POST['course']);
    $yearlvl = mysqli_real_escape_string($conn, $_POST['yearlvl']);
    $remaining_sessions = mysqli_real_escape_string($conn, $_POST['remaining_sessions']);

    // Update student information
    $query = "UPDATE users SET 
              firstname = '$firstname',
              midname = '$midname',
              lastname = '$lastname',
              email = '$email',
              course = '$course',
              yearlvl = '$yearlvl',
              remaining_sessions = '$remaining_sessions'
              WHERE idno = '$idno'";

    if (mysqli_query($conn, $query)) {
        // If password is provided, update it
        if (!empty($_POST['password'])) {
            $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
            $query = "UPDATE users SET password = '$password' WHERE idno = '$idno'";
            mysqli_query($conn, $query);
        }
        $_SESSION['message'] = "Student information updated successfully!";
        header("Location: homepage.php");
        exit();
    } else {
        $_SESSION['message'] = "Error updating student information: " . mysqli_error($conn);
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Student</title>
    <link rel="stylesheet" href="style.css">
    <style>
        body {
            background-color: #E0B0FF;
            margin: 0;
            padding: 0;
            height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .header {
            width: 100%;
            height: 80px;
            background-color: #E0B0FF;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .header-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            padding: 0 20px;
        }

        .header img.logo {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background-color: white;
            padding: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            color: black;
            margin: 0;
            font-size: 28px;
            white-space: nowrap;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
        }

        .main-content {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            width: 100%;
            max-width: 800px;
            background-color: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
            max-height: calc(100vh - 140px);
            overflow-y: auto;
        }

        .container::-webkit-scrollbar {
            width: 8px;
        }

        .container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
        }

        .container::-webkit-scrollbar-thumb {
            background: #E0B0FF;
            border-radius: 4px;
        }

        .form-group {
            margin-bottom: 25px;
        }

        .section-title {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
            font-size: 26px;
            font-weight: 600;
            position: relative;
            padding-bottom: 15px;
        }

        .section-title:after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 3px;
            background-color: #E0B0FF;
            border-radius: 2px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 15px;
        }

        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="number"],
        select {
            width: 100%;
            padding: 12px;
            border: 2px solid #eee;
            border-radius: 8px;
            margin-top: 5px;
            font-size: 15px;
            transition: all 0.3s ease;
        }

        input:focus,
        select:focus {
            border-color: #E0B0FF;
            outline: none;
            box-shadow: 0 0 0 3px rgba(224, 176, 255, 0.2);
        }

        input:disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
        }

        .btn-container {
            display: flex;
            gap: 15px;
            margin-top: 30px;
            justify-content: flex-end;
        }

        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background-color: #E0B0FF;
            color: black;
        }

        .btn-primary:hover {
            background-color: #C690FF;
            transform: translateY(-1px);
            color: white;
        }

        .btn-secondary {
            background-color: #6c757d;
            color: white;
        }

        .btn-secondary:hover {
            background-color: #5a6268;
            transform: translateY(-1px);
        }

        select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23333' viewBox='0 0 16 16'%3E%3Cpath d='M8 11.5l-5-5h10l-5 5z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            padding-right: 35px;
        }

        .form-row {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
        }

        .form-col {
            flex: 1;
        }

        .dashboard-label {
            background-color: #E0B0FF;
            color: black;
            padding: 5px 15px;
            border-radius: 15px;
            font-weight: 600;
            font-size: 16px;
            margin-left: 15px;
            border: 2px solid #C690FF;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <img src="logo ccs.png" class="logo" alt="Logo">
            <h1>CCS SIT-IN MONITORING SYSTEM</h1>
        </div>
    </div>

    <div class="main-content">
        <div class="container">
            <h2 class="section-title">Edit Student Information</h2>
            <form action="edit_student.php" method="post">
                <input type="hidden" name="idno" value="<?php echo htmlspecialchars($student['idno']); ?>">
                
                <div class="form-group">
                    <label>ID Number:</label>
                    <input type="text" value="<?php echo htmlspecialchars($student['idno']); ?>" disabled>
                </div>

                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label>First Name:</label>
                            <input type="text" name="firstname" value="<?php echo htmlspecialchars($student['firstname']); ?>" required>
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label>Middle Name:</label>
                            <input type="text" name="midname" value="<?php echo htmlspecialchars($student['midname']); ?>">
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label>Last Name:</label>
                            <input type="text" name="lastname" value="<?php echo htmlspecialchars($student['lastname']); ?>" required>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" name="email" value="<?php echo htmlspecialchars($student['email']); ?>" required>
                </div>

                <div class="form-row">
                    <div class="form-col">
                        <div class="form-group">
                            <label>Course:</label>
                            <select name="course" required>
                                <?php foreach ($courses as $key => $value): ?>
                                    <option value="<?php echo $key; ?>" <?php echo ($student['course'] == $key) ? 'selected' : ''; ?>>
                                        <?php echo $value; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label>Year Level:</label>
                            <select name="yearlvl" required>
                                <?php for ($i = 1; $i <= 4; $i++): ?>
                                    <option value="<?php echo $i; ?>" <?php echo ($student['yearlvl'] == $i) ? 'selected' : ''; ?>>
                                        <?php echo $i; ?>
                                    </option>
                                <?php endfor; ?>
                            </select>
                        </div>
                    </div>
                    <div class="form-col">
                        <div class="form-group">
                            <label>Remaining Sessions:</label>
                            <input type="number" name="remaining_sessions" value="<?php echo htmlspecialchars($student['remaining_sessions']); ?>" required min="0" max="100">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>New Password (leave blank to keep current):</label>
                    <input type="password" name="password">
                </div>

                <div class="btn-container">
                    <button type="button" class="btn btn-secondary" onclick="window.location.href='homepage.php'">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Student</button>
                </div>
            </form>
        </div>
    </div>
</body>
</html> 