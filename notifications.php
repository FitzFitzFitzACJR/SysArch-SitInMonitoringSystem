<?php
session_start();
include("database.php");

// Check if user is logged in
if (!isset($_SESSION['user'])) {
    header("Location: index.php");
    exit();
}

// Get the student ID
$student_id = $_SESSION['idno'];

// Get the latest notifications
$query = "SELECT * FROM notifications WHERE student_id = '$student_id' ORDER BY created_at DESC LIMIT 50";
$result = mysqli_query($conn, $query);

// Check if the notifications table exists, if not create it
$check_table_query = "SHOW TABLES LIKE 'notifications'";
$table_exists = mysqli_query($conn, $check_table_query);

if (mysqli_num_rows($table_exists) == 0) {
    // Create notifications table
    $create_table_query = "CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        type ENUM('reservation', 'reward', 'leaderboard', 'feedback', 'system') NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    if (mysqli_query($conn, $create_table_query)) {
        echo "<script>console.log('Notifications table created successfully');</script>";
    } else {
        echo "<script>console.error('Error creating notifications table: " . mysqli_error($conn) . "');</script>";
    }
}

// Function to add a notification
function addNotification($conn, $student_id, $type, $message) {
    $message = mysqli_real_escape_string($conn, $message);
    $query = "INSERT INTO notifications (student_id, type, message) VALUES ('$student_id', '$type', '$message')";
    return mysqli_query($conn, $query);
}

// Mark notification as read
if (isset($_GET['mark_read']) && is_numeric($_GET['mark_read'])) {
    $notification_id = mysqli_real_escape_string($conn, $_GET['mark_read']);
    $mark_read_query = "UPDATE notifications SET is_read = 1 WHERE id = '$notification_id' AND student_id = '$student_id'";
    mysqli_query($conn, $mark_read_query);
    header("Location: homepage.php#notifications");
    exit();
}

// Mark all notifications as read
if (isset($_GET['mark_all_read'])) {
    $mark_all_read_query = "UPDATE notifications SET is_read = 1 WHERE student_id = '$student_id'";
    mysqli_query($conn, $mark_all_read_query);
    header("Location: homepage.php#notifications");
    exit();
}

// Check for recent approved reservations that haven't been notified
$recent_reservations_query = "SELECT r.*, u.firstname, u.lastname FROM reservations r 
                            JOIN users u ON r.student_id = u.idno 
                            WHERE r.student_id = '$student_id' 
                            AND r.status = 'approved' 
                            AND r.notified = 0";
$recent_reservations = mysqli_query($conn, $recent_reservations_query);

if (mysqli_num_rows($recent_reservations) > 0) {
    // Add notification for each recent approved reservation
    while ($reservation = mysqli_fetch_assoc($recent_reservations)) {
        $message = "Your reservation for " . $reservation['date'] . " at " . $reservation['time_slot'] . " in room " . $reservation['room'] . " has been approved.";
        addNotification($conn, $student_id, 'reservation', $message);
        
        // Mark reservation as notified
        $update_query = "UPDATE reservations SET notified = 1 WHERE id = '" . $reservation['id'] . "'";
        mysqli_query($conn, $update_query);
    }
}

// Check for recent behavior points added
$recent_points_query = "SELECT * FROM points_log WHERE student_id = '$student_id' AND notified = 0";
$recent_points = mysqli_query($conn, $recent_points_query);

if (mysqli_num_rows($recent_points) > 0) {
    // Add notification for each recent points addition
    while ($points = mysqli_fetch_assoc($recent_points)) {
        $message = "You received " . $points['points_added'] . " behavior points for: " . $points['reason'];
        addNotification($conn, $student_id, 'reward', $message);
        
        // Mark points as notified
        $update_query = "UPDATE points_log SET notified = 1 WHERE id = '" . $points['id'] . "'";
        mysqli_query($conn, $update_query);
    }
}

// Check for feedback that has been read by admin
$feedback_read_query = "SELECT * FROM feedback WHERE student_id = '$student_id' AND is_read = 1 AND read_notified = 0";
$feedback_read = mysqli_query($conn, $feedback_read_query);

if (mysqli_num_rows($feedback_read) > 0) {
    // Add notification for each feedback that has been read
    while ($feedback = mysqli_fetch_assoc($feedback_read)) {
        $message = "Your feedback about Room " . $feedback['room'] . " has been read by the administrator.";
        addNotification($conn, $student_id, 'feedback', $message);
        
        // Mark feedback as notified
        $update_query = "UPDATE feedback SET read_notified = 1 WHERE id = '" . $feedback['id'] . "'";
        mysqli_query($conn, $update_query);
    }
}

// Check leaderboard position
$leaderboard_query = "SELECT student_id, attendance_count, 
                    (SELECT COUNT(*) + 1 FROM attendance_leaderboard a2 
                     WHERE a2.attendance_count > a1.attendance_count) AS position
                    FROM attendance_leaderboard a1
                    WHERE student_id = '$student_id'";
$leaderboard_result = mysqli_query($conn, $leaderboard_query);

if (mysqli_num_rows($leaderboard_result) > 0) {
    $leaderboard = mysqli_fetch_assoc($leaderboard_result);
    $position = $leaderboard['position'];
    
    // Check if position is in top 10
    if ($position <= 10) {
        // Check if we have already notified about this position
        $last_notified_query = "SELECT value FROM system_settings WHERE setting = 'last_leaderboard_position_" . $student_id . "'";
        $last_notified_result = mysqli_query($conn, $last_notified_query);
        
        if (mysqli_num_rows($last_notified_result) > 0) {
            $last_notified = mysqli_fetch_assoc($last_notified_result)['value'];
            
            if ($last_notified != $position) {
                // Add notification about new position
                $message = "Congratulations! You are now in position #" . $position . " on the attendance leaderboard.";
                addNotification($conn, $student_id, 'leaderboard', $message);
                
                // Update last notified position
                $update_query = "UPDATE system_settings SET value = '$position' WHERE setting = 'last_leaderboard_position_" . $student_id . "'";
                mysqli_query($conn, $update_query);
            }
        } else {
            // First time on leaderboard, add notification and setting
            $message = "Congratulations! You are now in position #" . $position . " on the attendance leaderboard.";
            addNotification($conn, $student_id, 'leaderboard', $message);
            
            // Insert last notified position
            $insert_query = "INSERT INTO system_settings (setting, value) VALUES ('last_leaderboard_position_" . $student_id . "', '$position')";
            mysqli_query($conn, $insert_query);
        }
    }
}

// Refresh the notification list
$query = "SELECT * FROM notifications WHERE student_id = '$student_id' ORDER BY created_at DESC LIMIT 50";
$result = mysqli_query($conn, $query);

// Count unread notifications
$unread_query = "SELECT COUNT(*) as unread FROM notifications WHERE student_id = '$student_id' AND is_read = 0";
$unread_result = mysqli_query($conn, $unread_query);
$unread_count = mysqli_fetch_assoc($unread_result)['unread'];

// Return the notifications as JSON if requested
if (isset($_GET['json'])) {
    $notifications = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $notifications[] = $row;
    }
    
    $response = [
        'count' => $unread_count,
        'notifications' => $notifications
    ];
    
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}
?> 