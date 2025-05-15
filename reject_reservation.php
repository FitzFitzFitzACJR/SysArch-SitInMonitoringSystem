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
        
        // Update reservation status to rejected and set response time
        $query = "UPDATE reservations SET status = 'rejected', updated_at = NOW(), response_time = NOW() WHERE id = '$id'";
        
        if (mysqli_query($conn, $query)) {
            // If the reservation is for today and has a computer assigned, update its status in lab_computers
            if ($date == date('Y-m-d') && $computer) {
                // Update the computer status back to vacant if it was reserved for this reservation
                $update_computer = "UPDATE lab_computers SET status = 'vacant' 
                                 WHERE computer_number = ? AND lab_id = ? AND status = 'reserved'";
                $stmt = mysqli_prepare($conn, $update_computer);
                mysqli_stmt_bind_param($stmt, "is", $computer, $room);
                mysqli_stmt_execute($stmt);
            }
            
            $_SESSION['message'] = "Reservation rejected successfully!";
        } else {
            $_SESSION['message'] = "Error rejecting reservation: " . mysqli_error($conn);
        }
    } else {
        $_SESSION['message'] = "Reservation not found!";
    }
}

// Return to the reservations section
header("Location: homepage.php#reservation-approval");
exit();
?> 