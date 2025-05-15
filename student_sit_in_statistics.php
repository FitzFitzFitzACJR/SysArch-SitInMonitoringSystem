<?php
// This script updates the student sit-in history statistics UI with modern cards

// Read the original file
$homepageContent = file_get_contents('homepage.php');

// Find the student history section statistics
$pattern = '/<div id="history" class="section-placeholder" style="display: none; margin-top: 120px;">(.*?)<h3 style="margin-top: 30px;">Sit-in History<\/h3>/s';
$replacement = '<div id="history" class="section-placeholder" style="display: none; margin-top: 120px;">
    <h2 style="text-align: center; margin-bottom: 30px;">Sit-in History</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    
    <?php
    // Get statistics for the cards
    $total_sessions_query = "SELECT COUNT(*) as count FROM sit_in_sessions WHERE student_id = \'{$_SESSION["idno"]}\' AND status = \'completed\'";
    $total_sessions_result = mysqli_query($conn, $total_sessions_query);
    $total_sessions = mysqli_fetch_assoc($total_sessions_result)[\'count\'];
    
    $total_duration_query = "SELECT SUM(duration) as total_minutes FROM sit_in_sessions WHERE student_id = \'{$_SESSION["idno"]}\' AND status = \'completed\'";
    $total_duration_result = mysqli_query($conn, $total_duration_query);
    $total_minutes = mysqli_fetch_assoc($total_duration_result)[\'total_minutes\'] ?? 0;
    $total_hours = round($total_minutes / 60, 1);
    
    $current_month = date(\'Y-m\');
    $month_sessions_query = "SELECT COUNT(*) as count FROM sit_in_sessions WHERE student_id = \'{$_SESSION["idno"]}\' AND status = \'completed\' AND DATE_FORMAT(session_start, \'%Y-%m\') = \'$current_month\'";
    $month_sessions_result = mysqli_query($conn, $month_sessions_query);
    $month_sessions = mysqli_fetch_assoc($month_sessions_result)[\'count\'];
    ?>
    
    <div class="statistics-cards">
        <div class="statistic-card primary">
            <div class="statistic-label">Total Sessions</div>
            <div class="statistic-value"><?php echo $total_sessions; ?></div>
            <div>Completed Sit-ins</div>
        </div>
        
        <div class="statistic-card secondary">
            <div class="statistic-label">Total Hours</div>
            <div class="statistic-value"><?php echo $total_hours; ?></div>
            <div>Study Time</div>
        </div>
        
        <div class="statistic-card tertiary">
            <div class="statistic-label">This Month</div>
            <div class="statistic-value"><?php echo $month_sessions; ?></div>
            <div>Sessions Completed</div>
        </div>
    </div>
    
    <h3 style="margin-top: 30px;">Sit-in History</h3>';

$homepageContent = preg_replace($pattern, $replacement, $homepageContent);

// Write the updated content back to the file
file_put_contents('homepage.php', $homepageContent);

echo "Student sit-in history statistics UI updated with modern cards successfully!";
?> 