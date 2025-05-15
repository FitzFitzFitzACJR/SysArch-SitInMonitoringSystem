<?php
// This file contains all student section divs
// To be included in homepage.php
?>

<!-- Student Profile Section -->
<div id="profile-section" class="section-placeholder" style="display: none; margin-top: 120px; overflow-y: visible; height: auto;">
    <h2 style="text-align: center; margin-bottom: 30px;">My Profile</h2>
    <div class="profile-content">
        <div class="user-info">
            <?php if (!empty($user['photo'])): ?>
                <img src="<?php echo 'uploads/' . $user['photo']; ?>" alt="Profile Photo" class="user-photo">
            <?php else: ?>
                <div class="user-photo" style="background-color: #F7B4C6; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 36px; color: white;"><?php echo strtoupper(substr($user['firstname'], 0, 1)); ?></span>
                </div>
            <?php endif; ?>
            
            <h3><?php echo htmlspecialchars($user['firstname'] . ' ' . $user['midname'] . ' ' . $user['lastname']); ?></h3>
            <p><strong>ID Number:</strong> <?php echo htmlspecialchars($user['idno']); ?></p>
            <p><strong>Email:</strong> <?php echo htmlspecialchars($user['email']); ?></p>
            <p><strong>Course:</strong> <?php echo htmlspecialchars($user['course_name']); ?></p>
            <p><strong>Year Level:</strong> <?php echo htmlspecialchars($user['yearlvl']); ?></p>
            
            <button class="edit-profile-btn" onclick="openEditProfileModal()">Edit Profile</button>
        </div>
        
        <div class="sessions-info">
            <div class="sessions-box">
                <h3>Available Sessions</h3>
                <div class="sessions-count"><?php echo isset($user['remaining_sessions']) ? $user['remaining_sessions'] : '0'; ?></div>
                <p>Remaining lab sessions this semester</p>
            </div>
            
            <div class="sessions-box">
                <h3>Behavior Points</h3>
                <div class="sessions-count" style="color: #28a745;"><?php echo isset($user['behavior_points']) ? $user['behavior_points'] : '0'; ?></div>
                <p>Earn points through good behavior</p>
            </div>
        </div>
    </div>
</div>

<!-- Student Sit-In Rules Section -->
<div id="rules" class="section-placeholder" style="display: none; margin-top: 120px; overflow-y: visible; height: auto;">
    <h2 style="text-align: center; margin-bottom: 30px;">Sit-In Rules</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    
    <div style="background-color: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin: 20px auto; max-width: 1000px;">
        <h3 style="text-align: center; margin-bottom: 20px; color: #333; border-bottom: 2px solid #F7B4C6; padding-bottom: 10px;">Sit-In Session Guidelines</h3>
        
        <ol style="line-height: 1.6;">
            <li>Students must check in with the laboratory assistant before using any computer.</li>
            <li>Each student is allocated a specific number of sit-in sessions per semester (currently 10).</li>
            <li>Sessions are non-transferable and must be used by the assigned student only.</li>
            <li>Each session has a maximum duration of 3 hours, unless extended by a laboratory assistant.</li>
            <li>Students must sign out when they finish their session to properly record their usage time.</li>
            <li>Students may earn additional sessions through good behavior points awarded by laboratory staff.</li>
            <li>Reservation is required for peak hours (10:00 AM - 3:00 PM) and can be made up to 7 days in advance.</li>
            <li>No food or drinks are allowed in the laboratory during sit-in sessions.</li>
            <li>File storage is temporary - students should bring their own storage devices or use cloud storage.</li>
            <li>Students must follow all laboratory rules and computer usage policies during sit-in sessions.</li>
        </ol>
        
        <div style="margin-top: 25px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #F7B4C6; font-style: italic;">
            <p>Failure to comply with these rules may result in the reduction of available sessions or suspension of sit-in privileges.</p>
        </div>
    </div>
</div>

<!-- Lab Rules Section -->
<div id="lab-rules" class="section-placeholder" style="display: none; margin-top: 120px; overflow-y: visible; height: auto;">
    <h2 style="text-align: center; margin-bottom: 30px;">Laboratory Rules and Regulations</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    <div style="background-color: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin: 20px auto; max-width: 1000px;">
        <h3 style="text-align: center; margin-bottom: 20px; color: #333; border-bottom: 2px solid #F7B4C6; padding-bottom: 10px;">General Rules</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <ol style="line-height: 1.5;">
                    <li>Maintain silence, proper decorum, and discipline inside the laboratory.</li>
                    <li>Games are not allowed inside the lab.</li>
                    <li>Internet surfing is allowed only with the instructor's permission.</li>
                    <li>Accessing non-course-related websites is prohibited.</li>
                    <li>Deleting computer files and changing the set-up is a major offense.</li>
                    <li>Observe the fifteen-minute computer time usage allowance.</li>
                    <li>Observe proper decorum while inside the laboratory.</li>
                    <li>Do not enter the lab unless the instructor is present.</li>
                    <li>All bags must be deposited at the counter.</li>
                </ol>
            </div>
            <div>
                <ol start="10" style="line-height: 1.5;">
                    <li>Follow the seating arrangement of your instructor.</li>
                    <li>At the end of class, close all software programs.</li>
                    <li>Return all chairs to their proper places after using.</li>
                    <li>Eating, drinking, smoking, and vandalism are prohibited.</li>
                    <li>Causing disturbances will result in being asked to leave.</li>
                    <li>Hostile or threatening behavior is not tolerated.</li>
                    <li>For serious offenses, lab personnel may call security.</li>
                    <li>Report technical problems to the lab supervisor immediately.</li>
                </ol>
            </div>
        </div>

        <h3 style="text-align: center; margin: 20px 0; color: #333; border-bottom: 2px solid #F7B4C6; padding-bottom: 10px;">Disciplinary Action</h3>
        <ul style="line-height: 1.5; padding-left: 20px;">
            <li><strong>First Offense</strong> - The Head or the Dean or OIC recommends to the Guidance Center for a suspension from classes for each offender.</li>
            <li><strong>Second and Subsequent Offenses</strong> - A recommendation for a heavier sanction will be endorsed to the Guidance Center.</li>
        </ul>
    </div>
</div>

<!-- Student History Section -->
<div id="history" class="section-placeholder" style="display: none; margin-top: 120px; overflow-y: visible; height: auto;">
    <h2 style="text-align: center; margin-bottom: 30px;">My Sit-In History</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    
    <?php
    // Get student's sit-in history
    $student_id = $_SESSION['idno'];
    $history_query = "SELECT * FROM sit_in_sessions WHERE student_id = '$student_id' ORDER BY session_start DESC";
    $history_result = mysqli_query($conn, $history_query);
    ?>
    
    <div class="history-container">
        <?php if (mysqli_num_rows($history_result) > 0): ?>
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Purpose</th>
                        <th>Laboratory</th>
                        <th>Computer</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while ($session = mysqli_fetch_assoc($history_result)): ?>
                        <?php
                        // Calculate duration
                        $duration = "In Progress";
                        if (!empty($session['session_end'])) {
                            $start = new DateTime($session['session_start']);
                            $end = new DateTime($session['session_end']);
                            $interval = $start->diff($end);
                            
                            $hours = $interval->h;
                            $minutes = $interval->i;
                            
                            if ($hours > 0) {
                                $duration = $hours . " hr" . ($hours > 1 ? "s" : "") . " " . $minutes . " min";
                            } else {
                                $duration = $minutes . " minutes";
                            }
                        }
                        ?>
                        <tr>
                            <td><?php echo date('M d, Y', strtotime($session['session_start'])); ?></td>
                            <td><?php echo htmlspecialchars($session['purpose']); ?></td>
                            <td>Room <?php echo htmlspecialchars($session['laboratory']); ?></td>
                            <td><?php echo isset($session['computer_id']) ? 'PC ' . htmlspecialchars($session['computer_id']) : 'N/A'; ?></td>
                            <td><?php echo date('h:i A', strtotime($session['session_start'])); ?></td>
                            <td><?php echo !empty($session['session_end']) ? date('h:i A', strtotime($session['session_end'])) : 'In Progress'; ?></td>
                            <td><?php echo $duration; ?></td>
                        </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
        <?php else: ?>
            <div class="no-history">
                <p>You don't have any sit-in history yet.</p>
                <p>Start using the computer laboratory to see your sessions here.</p>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Student Reservation Section -->
<div id="reservation" class="section-placeholder" style="display: none; margin-top: 120px; overflow-y: visible; height: auto;">
    <h2 style="text-align: center; margin-bottom: 30px;">My Reservations</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    
    <div class="reservation-container">
        <div class="reservation-form-container" style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 30px;">
            <h3 style="text-align: center; margin-bottom: 20px; color: #333; border-bottom: 2px solid #F7B4C6; padding-bottom: 10px;">Make a New Reservation</h3>
            
            <form class="reservation-form" action="submit_reservation.php" method="post">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label for="date">Date:</label>
                        <input type="date" id="date" name="date" min="<?php echo date('Y-m-d'); ?>" max="<?php echo date('Y-m-d', strtotime('+7 days')); ?>" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="time_slot">Time Slot:</label>
                        <select id="time_slot" name="time_slot" required>
                            <option value="">Select a time</option>
                            <option value="08:00:00-10:00:00">8:00 AM - 10:00 AM</option>
                            <option value="10:00:00-12:00:00">10:00 AM - 12:00 PM</option>
                            <option value="13:00:00-15:00:00">1:00 PM - 3:00 PM</option>
                            <option value="15:00:00-17:00:00">3:00 PM - 5:00 PM</option>
                            <option value="17:00:00-19:00:00">5:00 PM - 7:00 PM</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="room">Laboratory Room:</label>
                        <select id="room" name="room" required>
                            <option value="">Select a room</option>
                            <option value="524">Room 524</option>
                            <option value="526">Room 526</option>
                            <option value="528">Room 528</option>
                            <option value="530">Room 530</option>
                            <option value="547">Room 547</option>
                            <option value="MAC">MAC Lab</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="purpose">Purpose:</label>
                        <select id="purpose" name="purpose" required>
                            <option value="">Select a purpose</option>
                            <option value="C#">Programming in C#</option>
                            <option value="C">Programming in C</option>
                            <option value="Java">Programming in Java</option>
                            <option value="ASP.Net">ASP.Net Development</option>
                            <option value="PHP">PHP Development</option>
                            <option value="Research">Research</option>
                            <option value="Assignment">Assignment</option>
                            <option value="Project">Project Work</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                
                <input type="hidden" id="selected_pc" name="computer" value="">
                
                <button type="button" onclick="showPCOptions()" class="submit-btn" style="background-color: #F7B4C6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Continue to PC Selection</button>
            </form>
        </div>
        
        <div class="reservation-history" style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            <h3 style="text-align: center; margin-bottom: 20px; color: #333; border-bottom: 2px solid #F7B4C6; padding-bottom: 10px;">My Reservation History</h3>
            
            <?php
            // Get student's reservations
            $reservation_query = "SELECT * FROM reservations WHERE student_id = '$student_id' ORDER BY date DESC, time_slot DESC";
            $reservation_result = mysqli_query($conn, $reservation_query);
            ?>
            
            <?php if (mysqli_num_rows($reservation_result) > 0): ?>
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time Slot</th>
                            <th>Room</th>
                            <th>Computer</th>
                            <th>Purpose</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while ($reservation = mysqli_fetch_assoc($reservation_result)): ?>
                            <tr>
                                <td><?php echo date('M d, Y', strtotime($reservation['date'])); ?></td>
                                <td><?php echo str_replace('-', ' - ', $reservation['time_slot']); ?></td>
                                <td>Room <?php echo htmlspecialchars($reservation['room']); ?></td>
                                <td><?php echo isset($reservation['computer']) ? 'PC ' . htmlspecialchars($reservation['computer']) : 'Any'; ?></td>
                                <td><?php echo htmlspecialchars($reservation['purpose']); ?></td>
                                <td style="color: <?php 
                                    if ($reservation['status'] == 'approved') echo 'green';
                                    else if ($reservation['status'] == 'rejected') echo 'red';
                                    else echo 'orange';
                                ?>;"><?php echo ucfirst(htmlspecialchars($reservation['status'])); ?></td>
                            </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <div class="no-history">
                    <p>You don't have any reservation history yet.</p>
                    <p>Use the form above to make your first reservation.</p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Student Feedback Section -->
<div id="feedback" class="section-placeholder" style="display: none; margin-top: 120px; overflow-y: visible; height: auto;">
    <h2 style="text-align: center; margin-bottom: 30px;">Submit Feedback</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    
    <div class="feedback-form-container">
        <form action="submit_feedback.php" method="post" class="feedback-form">
            <div class="form-group">
                <label for="room">Laboratory Room:</label>
                <select id="feedback_room" name="room" required>
                    <option value="">Select a room</option>
                    <option value="524">Room 524</option>
                    <option value="526">Room 526</option>
                    <option value="528">Room 528</option>
                    <option value="530">Room 530</option>
                    <option value="547">Room 547</option>
                    <option value="MAC">MAC Lab</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="feedback_type">Feedback Type:</label>
                <select id="feedback_type" name="feedback_type" required>
                    <option value="">Select feedback type</option>
                    <option value="General">General Feedback</option>
                    <option value="Equipment">Equipment Issue</option>
                    <option value="Software">Software Issue</option>
                    <option value="Services">Staff/Services</option>
                    <option value="Suggestion">Suggestion</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="rating">Rate Your Experience (1-5):</label>
                <div class="star-rating">
                    <input type="radio" id="star5" name="rating" value="5" required><label for="star5">☆</label>
                    <input type="radio" id="star4" name="rating" value="4"><label for="star4">☆</label>
                    <input type="radio" id="star3" name="rating" value="3"><label for="star3">☆</label>
                    <input type="radio" id="star2" name="rating" value="2"><label for="star2">☆</label>
                    <input type="radio" id="star1" name="rating" value="1"><label for="star1">☆</label>
                </div>
            </div>
            
            <div class="form-group">
                <label for="comments">Comments:</label>
                <textarea id="comments" name="comments" required placeholder="Please provide details about your experience..."></textarea>
            </div>
            
            <div class="form-group">
                <label for="suggestions">Suggestions for Improvement (Optional):</label>
                <textarea id="suggestions" name="suggestions" placeholder="How can we improve our services?"></textarea>
            </div>
            
            <button type="submit" class="submit-btn">Submit Feedback</button>
        </form>
    </div>
</div>

<!-- Student Lab Resources Section -->
<div id="student-lab-resources" class="section-placeholder" style="display: none; margin-top: 120px; overflow-y: visible; height: auto;">
    <h2 style="text-align: center; margin-bottom: 30px;">Lab Resources</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    
    <div class="resources-container">
        <?php
        // Get active lab resources
        $resources_query = "SELECT * FROM lab_resources WHERE status = 'active' ORDER BY created_at DESC";
        $resources_result = mysqli_query($conn, $resources_query);
        ?>
        
        <?php if (mysqli_num_rows($resources_result) > 0): ?>
            <div class="resources-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px;">
                <?php while ($resource = mysqli_fetch_assoc($resources_result)): ?>
                    <div class="resource-card" style="background: #f8f9fa; border-radius: 10px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); transition: transform 0.3s ease;">
                        <h3 style="color: #333; margin-top: 0;"><?php echo htmlspecialchars($resource['title']); ?></h3>
                        <p style="color: #666; margin-bottom: 20px;"><?php echo htmlspecialchars($resource['description']); ?></p>
                        <a href="<?php echo htmlspecialchars($resource['link']); ?>" target="_blank" class="resource-link" style="background-color: #F7B4C6; color: white; padding: 8px 15px; border-radius: 5px; text-decoration: none; display: inline-block;">
                            Access Resource
                        </a>
                    </div>
                <?php endwhile; ?>
            </div>
        <?php else: ?>
            <div class="no-resources" style="text-align: center; padding: 50px; background: white; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <p style="font-size: 18px; margin-bottom: 10px;">No resources available at this time.</p>
                <p>Check back later for lab materials and resources.</p>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Lab Schedules Section -->
<div id="lab-schedules" class="section-placeholder" style="display: none; margin-top: 120px; overflow-y: visible; height: auto;">
    <h2 style="text-align: center; margin-bottom: 30px;">Laboratory Schedules</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    
    <div class="filter-controls" style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 0 0 20px 0; display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end;">
        <div class="filter-group" style="flex: 1; min-width: 200px;">
            <label for="student-room-filter" style="display: block; margin-bottom: 8px; font-weight: 500;">Filter by Room</label>
            <select id="student-room-filter" onchange="filterStudentSchedules()" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                <option value="all">All Rooms</option>
                <option value="517">Room 517</option>
                <option value="526">Room 526</option>
                <option value="528">Room 528</option>
                <option value="530">Room 530</option>
                <option value="547">Room 547</option>
                <option value="MAC">MAC Lab</option>
                <option value="524">Room 524</option>
            </select>
        </div>
        
        <div class="filter-group" style="flex: 1; min-width: 200px;">
            <label for="student-day-filter" style="display: block; margin-bottom: 8px; font-weight: 500;">Filter by Day</label>
            <select id="student-day-filter" onchange="filterStudentSchedules()" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
                <option value="all">All Days</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
            </select>
        </div>
        
        <div class="filter-group" style="flex: 2; min-width: 300px;">
            <label for="student-search-schedule" style="display: block; margin-bottom: 8px; font-weight: 500;">Search</label>
            <div style="position: relative;">
                <input type="text" id="student-search-schedule" onkeyup="filterStudentSchedules()" placeholder="Search by course or instructor..." style="width: 100%; padding: 10px 35px 10px 10px; border-radius: 5px; border: 1px solid #ddd;">
                <i class="fa fa-search" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #666;"></i>
            </div>
        </div>
    </div>
    
    <div id="student-schedule-container">
        <!-- This container will hold each room's schedule -->
        <?php
        // Get unique rooms
        $rooms_query = "SELECT DISTINCT room FROM lab_schedules ORDER BY room ASC";
        $rooms_result = mysqli_query($conn, $rooms_query);
        
        while ($room_row = mysqli_fetch_assoc($rooms_result)) {
            $room = $room_row['room'];
            
            // Count schedules for this room
            $count_query = "SELECT COUNT(*) as count FROM lab_schedules WHERE room = '$room'";
            $count_result = mysqli_query($conn, $count_query);
            $count = mysqli_fetch_assoc($count_result)['count'];
            
            echo '<div class="student-room-schedule" data-room="' . $room . '" style="margin-bottom: 30px; display: block;">';
            echo '<div class="room-header" style="background-color: #F7B4C6; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; display: flex; justify-content: space-between; align-items: center;">';
            echo '<h3 style="margin: 0;"><i class="fa fa-building" style="margin-right: 10px;"></i> Laboratory Room ' . $room . '</h3>';
            echo '<span class="schedule-count" style="background-color: white; color: #F7B4C6; padding: 3px 10px; border-radius: 20px; font-weight: bold;">' . $count . ' Schedule(s)</span>';
            echo '</div>';
            
            echo '<div class="schedule-table-wrapper" style="overflow-x: auto; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">';
            echo '<table class="schedule-table" style="width: 100%; border-collapse: collapse;">';
            
            // Table header
            echo '<thead>';
            echo '<tr style="background-color: #f5f5f5;">';
            echo '<th style="padding: 10px; text-align: left; border-right: 1px solid #ddd; min-width: 120px;">Time</th>';
            echo '<th style="padding: 10px; text-align: center; border-right: 1px solid #ddd; min-width: 160px;">Monday</th>';
            echo '<th style="padding: 10px; text-align: center; border-right: 1px solid #ddd; min-width: 160px;">Tuesday</th>';
            echo '<th style="padding: 10px; text-align: center; border-right: 1px solid #ddd; min-width: 160px;">Wednesday</th>';
            echo '<th style="padding: 10px; text-align: center; border-right: 1px solid #ddd; min-width: 160px;">Thursday</th>';
            echo '<th style="padding: 10px; text-align: center; border-right: 1px solid #ddd; min-width: 160px;">Friday</th>';
            echo '<th style="padding: 10px; text-align: center; min-width: 160px;">Saturday</th>';
            echo '</tr>';
            echo '</thead>';
            
            echo '<tbody>';
            
            // Time slots
            $time_slots = [
                '7:00:00 - 8:00:00', 
                '8:00:00 - 9:30:00', 
                '9:30:00 - 11:00:00', 
                '11:00:00 - 12:30:00',
                '12:30:00 - 15:00:00',
                '15:00:00 - 16:30:00',
                '16:30:00 - 18:00:00'
            ];
            
            foreach ($time_slots as $time_slot) {
                echo '<tr>';
                echo '<td style="padding: 10px; border-top: 1px solid #ddd; border-right: 1px solid #ddd; font-weight: 500;">' . $time_slot . '</td>';
                
                // For each day of the week
                $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                foreach ($days as $day) {
                    // Check if there's a class scheduled
                    $schedule_query = "SELECT * FROM lab_schedules WHERE room = '$room' AND day_of_week = '$day' AND time_slot = '$time_slot'";
                    $schedule_result = mysqli_query($conn, $schedule_query);
                    
                    echo '<td style="padding: 10px; border-top: 1px solid #ddd; ' . ($day != 'Saturday' ? 'border-right: 1px solid #ddd;' : '') . '">';
                    
                    if (mysqli_num_rows($schedule_result) > 0) {
                        $schedule = mysqli_fetch_assoc($schedule_result);
                        
                        echo '<div class="class-schedule" style="border-left: 3px solid #F7B4C6; padding-left: 10px;">';
                        echo '<div class="course-code" style="font-weight: bold; color: #F7B4C6;">' . htmlspecialchars($schedule['course_code']) . '</div>';
                        echo '<div class="instructor" style="font-size: 0.9em;">' . htmlspecialchars($schedule['instructor']) . '</div>';
                        echo '</div>';
                    } else {
                        echo '<div class="vacant" style="color: #6c757d; font-style: italic;">Vacant</div>';
                    }
                    
                    echo '</td>';
                }
                
                echo '</tr>';
            }
            
            echo '</tbody>';
            echo '</table>';
            echo '</div>';
            echo '</div>';
        }
        ?>
    </div>
    
    <script>
        function filterStudentSchedules() {
            const roomFilter = document.getElementById('student-room-filter').value;
            const dayFilter = document.getElementById('student-day-filter').value;
            const searchQuery = document.getElementById('student-search-schedule').value.toLowerCase();
            
            // Get all room schedules
            const roomSchedules = document.querySelectorAll('.student-room-schedule');
            
            // Iterate through each room schedule
            roomSchedules.forEach(roomSchedule => {
                const room = roomSchedule.getAttribute('data-room');
                let matchesRoom = roomFilter === 'all' || room === roomFilter;
                
                // If room doesn't match, hide the entire schedule
                if (!matchesRoom) {
                    roomSchedule.style.display = 'none';
                    return;
                }
                
                // If we're filtering by day or search term, we need to check individual cells
                if (dayFilter !== 'all' || searchQuery !== '') {
                    const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayFilter);
                    const rows = roomSchedule.querySelectorAll('tbody tr');
                    
                    // Check if any class in this room matches the criteria
                    let hasMatch = false;
                    
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        
                        // Skip the first cell (time slot)
                        for (let i = 1; i < cells.length; i++) {
                            // Skip cells that don't match the day filter
                            if (dayFilter !== 'all' && i - 1 !== dayIndex) continue;
                            
                            const cell = cells[i];
                            const courseElement = cell.querySelector('.course-code');
                            const instructorElement = cell.querySelector('.instructor');
                            
                            // Skip vacant cells
                            if (!courseElement || !instructorElement) continue;
                            
                            const courseText = courseElement.textContent.toLowerCase();
                            const instructorText = instructorElement.textContent.toLowerCase();
                            
                            // Check if the cell matches the search query
                            if (searchQuery === '' || courseText.includes(searchQuery) || instructorText.includes(searchQuery)) {
                                hasMatch = true;
                                break;
                            }
                        }
                        
                        if (hasMatch) return;
                    });
                    
                    roomSchedule.style.display = hasMatch ? 'block' : 'none';
                } else {
                    roomSchedule.style.display = 'block';
                }
            });
        }
    </script>
</div> 

<!-- Student Notifications Section -->
<div id="notifications" class="section-placeholder" style="display: none; margin-top: 120px;">
    <h2 style="text-align: center; margin-bottom: 30px;">Notifications</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    
    <div class="notifications-container" style="max-width: 800px; margin: 20px auto;">
        <div class="notifications-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0;">Recent Notifications</h3>
            <a href="notifications.php?mark_all_read=1" class="mark-all-read" style="color: #E0B0FF; text-decoration: none;">Mark All as Read</a>
        </div>
        
        <div id="notifications-list" style="margin-top: 20px;">
            <!-- Notifications will be loaded here dynamically -->
            <div class="loading-spinner" style="text-align: center; padding: 30px;">
                <p>Loading notifications...</p>
            </div>
        </div>
    </div>
</div>

<!-- Student Leaderboard Section -->
<div id="leaderboard" class="section-placeholder" style="display: none; margin-top: 120px;">
    <h2 style="text-align: center; margin-bottom: 30px;">Attendance Leaderboard</h2>
    <a href="#" class="back-btn" onclick="showStudentProfile(); return false;">Back to Profile</a>
    
    <div class="leaderboard-container" style="max-width: 900px; margin: 20px auto;">
        <div id="leaderboard-content" style="margin-top: 20px;">
            <!-- Leaderboard will be loaded here dynamically -->
            <div class="loading-spinner" style="text-align: center; padding: 30px;">
                <p>Loading leaderboard data...</p>
            </div>
        </div>
    </div>
</div> 