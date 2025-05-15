<?php
session_start();
if (!isset($_SESSION['user']) || !isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    header("Location: index.php");
    exit();
}

include("database.php");

if (isset($_GET['id'])) {
    $id = mysqli_real_escape_string($conn, $_GET['id']);
    
    // Get reservation details first
    $get_details = "SELECT room, computer, date FROM reservations WHERE id = ?";
    $stmt = mysqli_prepare($conn, $get_details);
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    if ($row = mysqli_fetch_assoc($result)) {
        $room = $row['room'];
        $computer = $row['computer'];
        $date = $row['date'];
        
        // Update reservation status to approved and set response time
        $query = "UPDATE reservations SET status = 'approved', updated_at = NOW(), response_time = NOW() WHERE id = '$id'";
        
        if (mysqli_query($conn, $query)) {
            // If the reservation is for today, update the lab_computers table
            if ($date == date('Y-m-d') && $computer) {
                // Check if entry exists in lab_computers
                $check_computer = "SELECT * FROM lab_computers WHERE computer_number = ? AND lab_id = ?";
                $stmt = mysqli_prepare($conn, $check_computer);
                mysqli_stmt_bind_param($stmt, "is", $computer, $room);
                mysqli_stmt_execute($stmt);
                $computer_result = mysqli_stmt_get_result($stmt);
                
                if (mysqli_num_rows($computer_result) > 0) {
                    // Update if not occupied
                    $update_computer = "UPDATE lab_computers SET status = 'reserved' 
                                     WHERE computer_number = ? AND lab_id = ? AND status != 'occupied'";
                    $stmt = mysqli_prepare($conn, $update_computer);
                    mysqli_stmt_bind_param($stmt, "is", $computer, $room);
                    mysqli_stmt_execute($stmt);
                } else {
                    // Create new record
                    $insert_computer = "INSERT INTO lab_computers (computer_number, lab_id, status, locked) 
                                     VALUES (?, ?, 'reserved', 0)";
                    $stmt = mysqli_prepare($conn, $insert_computer);
                    mysqli_stmt_bind_param($stmt, "is", $computer, $room);
                    mysqli_stmt_execute($stmt);
                }
            }
            
            $_SESSION['message'] = "Reservation approved successfully!";
        } else {
            $_SESSION['message'] = "Error approving reservation: " . mysqli_error($conn);
        }
    } else {
        $_SESSION['message'] = "Reservation not found!";
    }
}

// Return to the reservations section
header("Location: homepage.php#reservation-approval");
exit();
?> 