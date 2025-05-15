<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: index.php");
    exit();
}

include("database.php");

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $student_id = $_SESSION['idno'];
    $date = mysqli_real_escape_string($conn, $_POST['date']);
    $time_slot = mysqli_real_escape_string($conn, $_POST['time_slot']);
    $room = mysqli_real_escape_string($conn, $_POST['room']);
    $purpose = mysqli_real_escape_string($conn, $_POST['purpose']);
    $computer = isset($_POST['computer']) ? mysqli_real_escape_string($conn, $_POST['computer']) : null;

    // Check if there's already a reservation for this time slot, room and computer
    $check_query = "SELECT * FROM reservations 
                    WHERE date = '$date' 
                    AND time_slot = '$time_slot' 
                    AND room = '$room'
                    AND (computer = '$computer' OR computer IS NULL)
                    AND status != 'rejected'";
    $check_result = mysqli_query($conn, $check_query);

    if (mysqli_num_rows($check_result) > 0) {
        $_SESSION['message'] = "This time slot is already reserved for this room or computer. Please choose another time, room, or computer.";
    } else {
        // Insert the reservation
        $query = "INSERT INTO reservations (student_id, date, time_slot, room, computer, purpose, status) 
                  VALUES ('$student_id', '$date', '$time_slot', '$room', '$computer', '$purpose', 'pending')";
        
        if (mysqli_query($conn, $query)) {
            $_SESSION['message'] = "Reservation submitted successfully! Waiting for approval.";
        } else {
            $_SESSION['message'] = "Error submitting reservation: " . mysqli_error($conn);
        }
    }
}

header("Location: homepage.php#reservation");
exit();
?> 