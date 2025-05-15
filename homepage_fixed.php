<?php 
// This is a snippet from homepage.php with the correct div structure

// ... existing code ...

                <!-- Sit-in Records Section -->
                <div id="view-sit-in-records" class="admin-section" style="display: none;">
                    <div class="section-header">
                        <h2>Today's Sit-In Records</h2>
                        <a href="#home" class="back-btn">Back to Dashboard</a>
                    </div>
                    
                    <?php
                    // Get count of today's sit-in records
                    $today = date('Y-m-d');
                    $count_query = "SELECT COUNT(*) as count FROM sit_in_sessions WHERE DATE(session_start) = '$today'";
                    $count_result = mysqli_query($conn, $count_query);
                    $today_count = mysqli_fetch_assoc($count_result)['count'];
                    ?>
                    
                    <div class="today-count" style="background-color: #E0B0FF; color: black; padding: 10px 20px; border-radius: 8px; margin-bottom: 20px; display: inline-block;">
                        <strong>Today's Records:</strong> <?php echo $today_count; ?> sit-in sessions
                    </div>
                    
                    <!-- ... rest of the code ... -->
?> 