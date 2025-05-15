<!-- Student Notifications Section -->
<div id="notifications" class="section-placeholder" style="display: none; margin-top: 120px; overflow-y: visible; height: auto;">
    <h2 style="text-align: center; margin-bottom: 30px;">Notifications</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    
    <div class="notifications-container" style="background-color: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin: 20px auto; max-width: 1000px;">
        <div class="notifications-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">Recent Notifications</h3>
            <a href="notifications.php?mark_all_read=1" class="mark-all-read" style="color: #E0B0FF; text-decoration: none;">Mark All as Read</a>
        </div>
        
        <div class="notifications-stats" style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px;">
            <!-- Stat boxes for points, sit-ins, etc. -->
            <div class="stat-box" style="flex: 1; min-width: 200px; background-color: #f9f9f9; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h4 style="margin-top: 0; color: #E0B0FF;">Behavior Points</h4>
                <?php
                // Get current behavior points
                $points_query = "SELECT SUM(points_added) as total_points FROM points_log WHERE student_id = '{$_SESSION['idno']}'";
                $points_result = mysqli_query($conn, $points_query);
                $points = mysqli_fetch_assoc($points_result);
                $total_points = $points['total_points'] ?: 0;
                ?>
                <div style="font-size: 24px; font-weight: bold; margin: 10px 0;"><?php echo $total_points; ?></div>
                <p style="margin: 0; color: #666; font-size: 14px;">Total behavior points earned</p>
            </div>
            
            <div class="stat-box" style="flex: 1; min-width: 200px; background-color: #f9f9f9; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h4 style="margin-top: 0; color: #E0B0FF;">Remaining Sessions</h4>
                <?php
                // Get remaining sit-in sessions
                $sessions_query = "SELECT remaining_sessions FROM users WHERE idno = '{$_SESSION['idno']}'";
                $sessions_result = mysqli_query($conn, $sessions_query);
                $sessions = mysqli_fetch_assoc($sessions_result);
                $remaining_sessions = $sessions['remaining_sessions'] ?: 0;
                ?>
                <div style="font-size: 24px; font-weight: bold; margin: 10px 0;"><?php echo $remaining_sessions; ?></div>
                <p style="margin: 0; color: #666; font-size: 14px;">Sit-in sessions available</p>
            </div>
            
            <div class="stat-box" style="flex: 1; min-width: 200px; background-color: #f9f9f9; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h4 style="margin-top: 0; color: #E0B0FF;">Leaderboard Position</h4>
                <?php
                // Get leaderboard position
                $leaderboard_query = "SELECT 
                    (SELECT COUNT(*) + 1 FROM attendance_leaderboard a2 
                     WHERE a2.attendance_count > a1.attendance_count) AS position
                    FROM attendance_leaderboard a1
                    WHERE student_id = '{$_SESSION['idno']}'";
                $leaderboard_result = mysqli_query($conn, $leaderboard_query);
                
                if (mysqli_num_rows($leaderboard_result) > 0) {
                    $position = mysqli_fetch_assoc($leaderboard_result)['position'];
                } else {
                    $position = "N/A";
                }
                ?>
                <div style="font-size: 24px; font-weight: bold; margin: 10px 0;"><?php echo $position; ?></div>
                <p style="margin: 0; color: #666; font-size: 14px;">Your attendance ranking</p>
            </div>
        </div>
        
        <!-- Filter controls -->
        <div class="filter-controls" style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
            <select id="notification-filter" onchange="filterNotifications()" style="padding: 8px; border-radius: 5px; border: 1px solid #ddd;">
                <option value="all">All Notifications</option>
                <option value="reservation">Reservations</option>
                <option value="reward">Points & Rewards</option>
                <option value="leaderboard">Leaderboard</option>
                <option value="feedback">Feedback</option>
                <option value="system">System</option>
            </select>
        </div>
        
        <!-- Notifications list -->
        <div class="notifications-list" style="max-height: 600px; overflow-y: auto;">
            <?php
            // Get notifications for the current student
            $student_id = $_SESSION["idno"];
            $notifications_query = "SELECT * FROM notifications WHERE student_id = '$student_id' ORDER BY created_at DESC LIMIT 50";
            $notifications_result = mysqli_query($conn, $notifications_query);
            
            if (mysqli_num_rows($notifications_result) > 0) {
                while ($notification = mysqli_fetch_assoc($notifications_result)) {
                    $read_class = $notification['is_read'] ? 'read' : 'unread';
                    $type_icon = '';
                    
                    // Determine icon based on notification type
                    switch($notification['type']) {
                        case 'reservation':
                            $type_icon = '<i class="fa fa-calendar" style="color: #E0B0FF;"></i>';
                            break;
                        case 'reward':
                            $type_icon = '<i class="fa fa-trophy" style="color: #FFD700;"></i>';
                            break;
                        case 'leaderboard':
                            $type_icon = '<i class="fa fa-chart-line" style="color: #28a745;"></i>';
                            break;
                        case 'feedback':
                            $type_icon = '<i class="fa fa-comment" style="color: #17a2b8;"></i>';
                            break;
                        case 'system':
                            $type_icon = '<i class="fa fa-cog" style="color: #6c757d;"></i>';
                            break;
                        default:
                            $type_icon = '<i class="fa fa-bell" style="color: #E0B0FF;"></i>';
                    }
                    
                    echo '<div class="notification-item ' . $read_class . '" data-type="' . $notification['type'] . '" style="padding: 15px; border-bottom: 1px solid #eee; position: relative; ' . ($notification['is_read'] ? '' : 'background-color: #f8f9fa;') . '">';
                    echo '<div style="display: flex; align-items: flex-start;">';
                    echo '<div style="margin-right: 15px; font-size: 20px;">' . $type_icon . '</div>';
                    echo '<div style="flex: 1;">';
                    echo '<div style="margin-bottom: 5px; font-weight: ' . ($notification['is_read'] ? 'normal' : 'bold') . ';">' . nl2br(htmlspecialchars($notification['message'])) . '</div>';
                    echo '<div style="font-size: 12px; color: #6c757d;">' . date('M d, Y h:i A', strtotime($notification['created_at'])) . '</div>';
                    echo '</div>';
                    
                    // Show mark as read button for unread notifications
                    if (!$notification['is_read']) {
                        echo '<a href="notifications.php?mark_read=' . $notification['id'] . '" class="mark-read-btn" style="color: #E0B0FF; text-decoration: none; font-size: 12px;">Mark as read</a>';
                    }
                    
                    echo '</div>';
                    echo '</div>';
                }
            } else {
                echo '<div class="empty-state" style="text-align: center; padding: 30px; color: #6c757d;">';
                echo '<i class="fa fa-bell-slash" style="font-size: 48px; margin-bottom: 10px; color: #ddd;"></i>';
                echo '<p>No notifications yet!</p>';
                echo '</div>';
            }
            ?>
        </div>
    </div>
    
    <script>
        // Function to filter notifications by type
        function filterNotifications() {
            const filterValue = document.getElementById('notification-filter').value;
            const notifications = document.querySelectorAll('.notification-item');
            
            notifications.forEach(notification => {
                if (filterValue === 'all' || notification.dataset.type === filterValue) {
                    notification.style.display = 'block';
                } else {
                    notification.style.display = 'none';
                }
            });
        }
        
        // Function to refresh notifications
        function refreshNotifications() {
            fetch('notifications.php?json=1')
                .then(response => response.json())
                .then(data => {
                    // Update notification count in the sidebar
                    const badge = document.getElementById('notification-badge');
                    if (badge) {
                        if (data.count > 0) {
                            badge.textContent = data.count;
                            badge.style.display = 'inline-block';
                        } else {
                            badge.style.display = 'none';
                        }
                    }
                })
                .catch(error => console.error('Error refreshing notifications:', error));
        }
        
        // Refresh notifications periodically
        setInterval(refreshNotifications, 60000); // Every minute
        
        // Initial refresh
        document.addEventListener('DOMContentLoaded', refreshNotifications);
    </script>
</div> 