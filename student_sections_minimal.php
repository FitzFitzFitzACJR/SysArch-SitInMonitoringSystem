<?php
// This is a minimal version of student sections to ensure they appear properly
?>

<!-- Student Profile Section -->
<div id="profile-section" class="section-placeholder" style="display: none; margin-top: 120px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <h2 style="text-align: center; margin-bottom: 30px;">My Profile</h2>
    <div style="text-align: center;">
        <h3><?php echo htmlspecialchars($user['firstname'] . ' ' . $user['lastname']); ?></h3>
        <p><strong>ID Number:</strong> <?php echo htmlspecialchars($user['idno']); ?></p>
        <p><strong>Email:</strong> <?php echo htmlspecialchars($user['email']); ?></p>
        <p><strong>Course:</strong> <?php echo htmlspecialchars($user['course_name']); ?></p>
        <button onclick="openEditProfileModal()" style="background-color: #F7B4C6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Edit Profile</button>
    </div>
</div>

<!-- Rules Section -->
<div id="rules" class="section-placeholder" style="display: none; margin-top: 120px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <h2 style="text-align: center; margin-bottom: 30px;">Sit-In Rules</h2>
    <a href="#" onclick="showStudentProfile(); return false;" style="display: inline-block; margin-bottom: 20px; color: #F7B4C6;">Back to Profile</a>
    <p>Rules content goes here.</p>
</div>

<!-- Lab Rules Section -->
<div id="lab-rules" class="section-placeholder" style="display: none; margin-top: 120px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <h2 style="text-align: center; margin-bottom: 30px;">Lab Rules & Regulations</h2>
    <a href="#" onclick="showStudentProfile(); return false;" style="display: inline-block; margin-bottom: 20px; color: #F7B4C6;">Back to Profile</a>
    <p>Lab rules content goes here.</p>
</div>

<!-- History Section -->
<div id="history" class="section-placeholder" style="display: none; margin-top: 120px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <h2 style="text-align: center; margin-bottom: 30px;">My History</h2>
    <a href="#" onclick="showStudentProfile(); return false;" style="display: inline-block; margin-bottom: 20px; color: #F7B4C6;">Back to Profile</a>
    <p>History content goes here.</p>
</div>

<!-- Reservation Section -->
<div id="reservation" class="section-placeholder" style="display: none; margin-top: 120px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <h2 style="text-align: center; margin-bottom: 30px;">My Reservations</h2>
    <a href="#" onclick="showStudentProfile(); return false;" style="display: inline-block; margin-bottom: 20px; color: #F7B4C6;">Back to Profile</a>
    <p>Reservation form and history goes here.</p>
</div>

<!-- Lab Resources Section -->
<div id="student-lab-resources" class="section-placeholder" style="display: none; margin-top: 120px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <h2 style="text-align: center; margin-bottom: 30px;">Lab Resources</h2>
    <a href="#" onclick="showStudentProfile(); return false;" style="display: inline-block; margin-bottom: 20px; color: #F7B4C6;">Back to Profile</a>
    <p>Lab resources go here.</p>
</div>

<!-- Feedback Section -->
<div id="feedback" class="section-placeholder" style="display: none; margin-top: 120px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <h2 style="text-align: center; margin-bottom: 30px;">Submit Feedback</h2>
    <a href="#" onclick="showStudentProfile(); return false;" style="display: inline-block; margin-bottom: 20px; color: #F7B4C6;">Back to Profile</a>
    <p>Feedback form goes here.</p>
</div>

<!-- Lab Schedules Section -->
<div id="lab-schedules" class="section-placeholder" style="display: none; margin-top: 120px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <h2 style="text-align: center; margin-bottom: 30px;">Lab Schedules</h2>
    <a href="#" onclick="showStudentProfile(); return false;" style="display: inline-block; margin-bottom: 20px; color: #F7B4C6;">Back to Profile</a>
    <p>Lab schedules go here.</p>
</div> 