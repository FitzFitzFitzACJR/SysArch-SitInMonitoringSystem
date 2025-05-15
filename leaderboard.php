<?php
session_start();
include("database.php");

// Check if user is logged in
if (!isset($_SESSION['user'])) {
    header("Location: index.php");
    exit();
}

// Get student ID
$student_id = $_SESSION['idno'];

// Get leaderboard data - top 10 students
$leaderboard_query = "SELECT al.*, u.firstname, u.lastname, u.midname, u.course, u.yearlvl 
                    FROM attendance_leaderboard al
                    JOIN users u ON al.student_id = u.idno
                    ORDER BY al.attendance_count DESC
                    LIMIT 10";
$leaderboard_result = mysqli_query($conn, $leaderboard_query);

// Check if attendance_leaderboard table exists, if not create it
$check_table_query = "SHOW TABLES LIKE 'attendance_leaderboard'";
$table_exists = mysqli_query($conn, $check_table_query);

if (mysqli_num_rows($table_exists) == 0) {
    // Create attendance_leaderboard table
    $create_table_query = "CREATE TABLE attendance_leaderboard (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        attendance_count INT DEFAULT 0,
        UNIQUE KEY (student_id)
    )";
    
    if (mysqli_query($conn, $create_table_query)) {
        echo "<script>console.log('attendance_leaderboard table created successfully');</script>";
        
        // Populate the table with initial data from sit_in_sessions
        $populate_query = "INSERT INTO attendance_leaderboard (student_id, attendance_count)
                        SELECT student_id, COUNT(*) as attendance_count
                        FROM sit_in_sessions
                        GROUP BY student_id";
        
        if (mysqli_query($conn, $populate_query)) {
            echo "<script>console.log('attendance_leaderboard table populated successfully');</script>";
        } else {
            echo "<script>console.error('Error populating attendance_leaderboard table: " . mysqli_error($conn) . "');</script>";
        }
    } else {
        echo "<script>console.error('Error creating attendance_leaderboard table: " . mysqli_error($conn) . "');</script>";
    }
}

// Get current user's position
$position_query = "SELECT student_id, attendance_count, 
                (SELECT COUNT(*) + 1 FROM attendance_leaderboard a2 
                 WHERE a2.attendance_count > a1.attendance_count) AS position
                FROM attendance_leaderboard a1
                WHERE student_id = '$student_id'";
$position_result = mysqli_query($conn, $position_query);

$user_position = 0;
$user_count = 0;
$is_in_top_10 = false;

if (mysqli_num_rows($position_result) > 0) {
    $position_data = mysqli_fetch_assoc($position_result);
    $user_position = $position_data['position'];
    $user_count = $position_data['attendance_count'];
}

// Check if user is in top 10
while ($leader = mysqli_fetch_assoc($leaderboard_result)) {
    if ($leader['student_id'] == $student_id) {
        $is_in_top_10 = true;
        break;
    }
}

// Reset the result pointer
mysqli_data_seek($leaderboard_result, 0);

// Return JSON if requested
if (isset($_GET['json'])) {
    $leaders = [];
    while ($row = mysqli_fetch_assoc($leaderboard_result)) {
        $leaders[] = $row;
    }
    
    $response = [
        'leaders' => $leaders,
        'user_position' => $user_position,
        'user_count' => $user_count,
        'is_in_top_10' => $is_in_top_10
    ];
    
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

// Get total students in leaderboard
$total_query = "SELECT COUNT(*) as total FROM attendance_leaderboard";
$total_result = mysqli_query($conn, $total_query);
$total_students = mysqli_fetch_assoc($total_result)['total'];

// Get top student
$top_query = "SELECT al.*, u.firstname, u.lastname, u.midname 
            FROM attendance_leaderboard al
            JOIN users u ON al.student_id = u.idno
            ORDER BY al.attendance_count DESC
            LIMIT 1";
$top_result = mysqli_query($conn, $top_query);
$top_student = mysqli_fetch_assoc($top_result);

// Get courses for mapping
$courses = [
    1 => 'BS Information Technology',
    2 => 'BS Computer Science',
    3 => 'BS Information Systems',
    4 => 'BS Accountancy',
    5 => 'BS Criminology'
];

// Get year levels for mapping
$year_levels = [
    1 => '1st Year',
    2 => '2nd Year',
    3 => '3rd Year',
    4 => '4th Year'
];
?> 