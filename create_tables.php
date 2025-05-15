<?php
session_start();
include("database.php");

// Only admin can access this script
if (!isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    die("Access Denied: Admin privileges required.");
}

// Function to create a table if it doesn't exist
function createTableIfNotExists($conn, $table_name, $query) {
    // Check if table exists
    $check_table = mysqli_query($conn, "SHOW TABLES LIKE '$table_name'");
    if (mysqli_num_rows($check_table) == 0) {
        // Table doesn't exist, create it
        if (mysqli_query($conn, $query)) {
            echo "Table '$table_name' created successfully!<br>";
        } else {
            echo "Error creating table '$table_name': " . mysqli_error($conn) . "<br>";
        }
    } else {
        echo "Table '$table_name' already exists.<br>";
    }
}

// Check users table
$users_table = "CREATE TABLE IF NOT EXISTS users (
    idno VARCHAR(20) PRIMARY KEY,
    firstname VARCHAR(100),
    midname VARCHAR(100),
    lastname VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    course INT,
    yearlvl INT,
    password VARCHAR(255),
    remaining_sessions INT DEFAULT 10,
    behavior_points INT DEFAULT 0,
    photo VARCHAR(255)
)";

createTableIfNotExists($conn, "users", $users_table);

// Check announcements table
$announcements_table = "CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active'
)";

createTableIfNotExists($conn, "announcements", $announcements_table);

// Check sit_in_sessions table
$sit_in_sessions_table = "CREATE TABLE IF NOT EXISTS sit_in_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    purpose VARCHAR(255),
    laboratory VARCHAR(10),
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME NULL,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES users(idno) ON DELETE CASCADE
)";

createTableIfNotExists($conn, "sit_in_sessions", $sit_in_sessions_table);

// Check reservations table
$reservations_table = "CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    date DATE,
    time_slot VARCHAR(20),
    purpose VARCHAR(255),
    programming_language VARCHAR(50),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(idno) ON DELETE CASCADE
)";

createTableIfNotExists($conn, "reservations", $reservations_table);

// Check points_log table
$points_log_table = "CREATE TABLE IF NOT EXISTS points_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    points_added INT,
    reason TEXT,
    sessions_added INT,
    added_by VARCHAR(20),
    added_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(idno) ON DELETE CASCADE
)";

createTableIfNotExists($conn, "points_log", $points_log_table);

// Insert sample data for testing if tables are empty
$check_users = mysqli_query($conn, "SELECT * FROM users");
if (mysqli_num_rows($check_users) == 0) {
    // Insert admin user
    $admin_password = password_hash("admin123", PASSWORD_DEFAULT);
    mysqli_query($conn, "INSERT INTO users (idno, firstname, lastname, email, password) VALUES ('00', 'Admin', 'User', 'admin@example.com', '$admin_password')");
    
    // Insert sample student
    $student_password = password_hash("student123", PASSWORD_DEFAULT);
    mysqli_query($conn, "INSERT INTO users (idno, firstname, midname, lastname, email, course, yearlvl, password, remaining_sessions) 
                        VALUES ('2023-0001', 'John', 'M', 'Doe', 'john@example.com', 1, 2, '$student_password', 10)");
                        
    echo "Sample user data inserted!<br>";
}

// Insert sample sit-in sessions if empty
$check_sessions = mysqli_query($conn, "SELECT * FROM sit_in_sessions");
if (mysqli_num_rows($check_sessions) == 0) {
    // Insert sample sit-in sessions
    $labs = ['524', '526', '528', '530', '547', 'MAC'];
    $languages = ['C#', 'C', 'Java', 'ASP.Net', 'PHP'];
    
    // Get a sample student
    $student_query = mysqli_query($conn, "SELECT idno FROM users WHERE idno != '00' LIMIT 1");
    if (mysqli_num_rows($student_query) > 0) {
        $student = mysqli_fetch_assoc($student_query);
        $student_id = $student['idno'];
        
        // Insert 10 random sessions
        for ($i = 0; $i < 10; $i++) {
            $lab = $labs[array_rand($labs)];
            $lang = $languages[array_rand($languages)];
            $purpose = "Programming in $lang";
            
            // Random date in the past 30 days
            $days_ago = rand(1, 30);
            $hours = rand(1, 3);
            $start_date = date('Y-m-d H:i:s', strtotime("-$days_ago days"));
            $end_date = date('Y-m-d H:i:s', strtotime("$start_date +$hours hours"));
            
            mysqli_query($conn, "INSERT INTO sit_in_sessions 
                               (student_id, purpose, laboratory, session_start, session_end, status) 
                               VALUES 
                               ('$student_id', '$purpose', '$lab', '$start_date', '$end_date', 'completed')");
        }
        
        echo "Sample sit-in sessions inserted!<br>";
    }
}

// Check if computer_status table exists
$table_check = mysqli_query($conn, "SHOW TABLES LIKE 'computer_status'");

if (mysqli_num_rows($table_check) == 0) {
    // Table doesn't exist, create it
    $create_table = "CREATE TABLE computer_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lab_id VARCHAR(20) NOT NULL,
        computer_number INT NOT NULL,
        status ENUM('locked', 'unlocked') DEFAULT 'unlocked',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY lab_computer (lab_id, computer_number)
    )";
    
    if (mysqli_query($conn, $create_table)) {
        echo "Successfully created computer_status table.";
    } else {
        echo "Error creating computer_status table: " . mysqli_error($conn);
    }
} else {
    echo "Table computer_status already exists.";
}

// Check if admin_logs table exists
$log_table_check = mysqli_query($conn, "SHOW TABLES LIKE 'admin_logs'");

if (mysqli_num_rows($log_table_check) == 0) {
    // Table doesn't exist, create it
    $create_log_table = "CREATE TABLE admin_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id VARCHAR(20) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    if (mysqli_query($conn, $create_log_table)) {
        echo "<br>Successfully created admin_logs table.";
    } else {
        echo "<br>Error creating admin_logs table: " . mysqli_error($conn);
    }
} else {
    echo "<br>Table admin_logs already exists.";
}

echo "<br>Database setup completed! <a href='index.php'>Go to login page</a>";
?> 