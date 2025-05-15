<?php
// This script updates the student sit-in history statistics UI with modern cards

// Read the original file
$homepageContent = file_get_contents('homepage.php');

// Find the student history section statistics
$pattern = '/<div id="history" class="section-placeholder" style="display: none; margin-top: 120px;">(.*?)<h3 style="margin-top: 30px;">Sit-in History<\/h3>/s';
$replacement = '<div id="history" class="section-placeholder" style="display: none; margin-top: 120px;">
    <h2 style="text-align: center; margin-bottom: 30px; color: #333;">Sit-in History</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;" style="background-color: #E0B0FF; color: white; padding: 8px 15px; border-radius: 5px; text-decoration: none; display: inline-block; margin-bottom: 20px;">Back to Profile</a>
    
    <?php
    // Get statistics for the cards
    $total_sessions_query = "SELECT COUNT(*) as count FROM sit_in_sessions WHERE student_id = \'{$_SESSION["idno"]}\' AND status = \'completed\'";
    $total_sessions_result = mysqli_query($conn, $total_sessions_query);
    $total_sessions = mysqli_fetch_assoc($total_sessions_result)[\'count\'] ?? 0;
    
    $active_sessions_query = "SELECT COUNT(*) as count FROM sit_in_sessions WHERE student_id = \'{$_SESSION["idno"]}\' AND status = \'active\'";
    $active_sessions_result = mysqli_query($conn, $active_sessions_query);
    $active_sessions = mysqli_fetch_assoc($active_sessions_result)[\'count\'] ?? 0;
    
    $total_duration_query = "SELECT SUM(duration) as total_minutes FROM sit_in_sessions WHERE student_id = \'{$_SESSION["idno"]}\' AND status = \'completed\'";
    $total_duration_result = mysqli_query($conn, $total_duration_query);
    $total_minutes = mysqli_fetch_assoc($total_duration_result)[\'total_minutes\'] ?? 0;
    $total_hours = round($total_minutes / 60, 1);
    
    $current_month = date(\'Y-m\');
    $month_sessions_query = "SELECT COUNT(*) as count FROM sit_in_sessions WHERE student_id = \'{$_SESSION["idno"]}\' AND status = \'completed\' AND DATE_FORMAT(session_start, \'%Y-%m\') = \'$current_month\'";
    $month_sessions_result = mysqli_query($conn, $month_sessions_query);
    $month_sessions = mysqli_fetch_assoc($month_sessions_result)[\'count\'] ?? 0;
    ?>
    
    <div class="statistics-cards">
        <div class="statistic-card primary">
            <div class="statistic-label">Currently Active</div>
            <div class="statistic-value" style="color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1);"><?php echo $active_sessions; ?></div>
            <div style="color: rgba(255,255,255,0.8);">Active Sit-ins</div>
            <div class="card-bg" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #E0B0FF, #d580ff); z-index: -1; border-radius: 10px;"></div>
        </div>
        
        <div class="statistic-card secondary">
            <div class="statistic-label">Total Sessions</div>
            <div class="statistic-value" style="color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1);"><?php echo $total_sessions; ?></div>
            <div style="color: rgba(255,255,255,0.8);">Completed Sit-ins</div>
            <div class="card-bg" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #F7B4C6, #ff9eb5); z-index: -1; border-radius: 10px;"></div>
        </div>
        
        <div class="statistic-card tertiary">
            <div class="statistic-label">Total Hours</div>
            <div class="statistic-value" style="color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1);"><?php echo $total_hours; ?></div>
            <div style="color: rgba(255,255,255,0.8);">Study Time</div>
            <div class="card-bg" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #90d0ff, #58b5ff); z-index: -1; border-radius: 10px;"></div>
        </div>
        
        <div class="statistic-card">
            <div class="statistic-label">This Month</div>
            <div class="statistic-value" style="color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1);"><?php echo $month_sessions; ?></div>
            <div style="color: rgba(255,255,255,0.8);">Sessions Completed</div>
            <div class="card-bg" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #b8a3fc, #8870e7); z-index: -1; border-radius: 10px;"></div>
        </div>
    </div>
    
    <h3 style="margin-top: 30px; color: #444;">Sit-in History</h3>';

$homepageContent = preg_replace($pattern, $replacement, $homepageContent);

// Update the CSS for the statistics cards
$cssPattern = '/\/\* Sit-in History Statistics Cards \*\/.*?\.statistic-label \{.*?\}/s';
$cssReplacement = '/* Sit-in History Statistics Cards */
        .statistics-cards {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .statistic-card {
            flex: 1;
            min-width: 220px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            padding: 24px;
            text-align: center;
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            z-index: 1;
        }
        
        .statistic-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        
        .statistic-card .statistic-value {
            font-size: 42px;
            font-weight: bold;
            margin: 15px 0;
            position: relative;
            z-index: 2;
        }
        
        .statistic-card .statistic-label {
            color: rgba(255,255,255,0.9);
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            position: relative;
            z-index: 2;
        }';

// Check if the CSS pattern exists, if not add it to the style tag
if (strpos($homepageContent, '/* Sit-in History Statistics Cards */') !== false) {
    $homepageContent = preg_replace($cssPattern, $cssReplacement, $homepageContent);
} else {
    // Add the CSS to the style tag
    $stylePattern = '/<style>(.*?)<\/style>/s';
    $stylePrependReplacement = '<style>$1
        ' . $cssReplacement;
    $homepageContent = preg_replace($stylePattern, $stylePrependReplacement, $homepageContent);
}

// Write the updated content back to the file
file_put_contents('homepage.php', $homepageContent);

echo "Student sit-in history statistics UI updated with modern cards and aligned with the site theme successfully!";
?> 