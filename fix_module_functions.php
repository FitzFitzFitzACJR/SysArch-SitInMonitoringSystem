<?php
// Fix module functions in homepage.php

// Create backup
copy('homepage.php', 'homepage.php.modules_fixed_' . time());
echo "Created backup of homepage.php<br>";

// Read the file
$content = file_get_contents('homepage.php');

// Add module functionality JavaScript code right before </body>
$js_code = <<<'EOD'
<script>
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    
    // Define global functions for showing sections
    
    // Admin functions
    window.hideAllAdminSections = function() {
        console.log("Hiding all admin sections");
        document.querySelectorAll('.admin-section, .admin-dashboard > div').forEach(section => {
            section.style.display = 'none';
        });
    };
    
    window.showAdminSection = function(sectionId) {
        console.log("Showing admin section:", sectionId);
        hideAllAdminSections();
        var section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        } else {
            console.error("Admin section not found:", sectionId);
        }
    };
    
    // Student functions
    window.hideAllStudentSections = function() {
        console.log("Hiding all student sections");
        document.querySelectorAll('.section-placeholder, #profile-section').forEach(section => {
            section.style.display = 'none';
        });
    };
    
    window.showStudentSection = function(sectionId) {
        console.log("Showing student section:", sectionId);
        hideAllStudentSections();
        var section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        } else {
            console.error("Student section not found:", sectionId);
        }
    };
    
    // Specific section show functions
    window.showStudentProfile = function() {
        console.log("Show student profile called");
        showStudentSection('profile-section');
    };
    
    window.showStudentRules = function() {
        console.log("Show student rules called");
        showStudentSection('rules');
    };
    
    window.showLabRules = function() {
        console.log("Show lab rules called");
        showStudentSection('lab-rules');
    };
    
    window.showStudentHistory = function() {
        console.log("Show student history called");
        showStudentSection('history');
    };
    
    window.showStudentReservation = function() {
        console.log("Show student reservation called");
        showStudentSection('reservation');
    };
    
    window.showStudentLabResources = function() {
        console.log("Show student lab resources called");
        showStudentSection('student-lab-resources');
    };
    
    window.showStudentFeedback = function() {
        console.log("Show student feedback called");
        showStudentSection('feedback');
    };
    
    window.showLabSchedules = function() {
        console.log("Show lab schedules called");
        showStudentSection('lab-schedules');
    };
    
    // Admin section specific functions
    window.showHome = function() {
        console.log("Show admin home called");
        showAdminSection('home');
    };
    
    window.showStudents = function() {
        console.log("Show students called");
        showAdminSection('students');
    };
    
    window.showCurrentSitIn = function() {
        console.log("Show current sit-in called");
        showAdminSection('current-sit-in');
    };
    
    window.showViewSitInRecords = function() {
        console.log("Show view sit-in records called");
        showAdminSection('view-sit-in-records');
    };
    
    window.showLabScheduleAdmin = function() {
        console.log("Show lab schedule called");
        showAdminSection('lab-schedule');
    };
    
    window.showReservationApproval = function() {
        console.log("Show reservation approval called");
        showAdminSection('reservation-approval');
    };
    
    window.showLabResources = function() {
        console.log("Show lab resources called");
        showAdminSection('lab-resources');
    };
    
    window.showFeedbackReports = function() {
        console.log("Show feedback reports called");
        showAdminSection('feedback-reports');
    };
    
    window.showComputerControl = function() {
        console.log("Show computer control called");
        showAdminSection('computer-control');
        
        // If the computer control module has a function to load computers, call it
        if (typeof loadControlComputers === 'function') {
            console.log("Loading computer control data");
            loadControlComputers();
        } else {
            console.error("loadControlComputers function not found");
        }
    };
    
    // Setup event listeners for admin sidebar
    document.querySelectorAll('.admin-sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#logout') {
                e.preventDefault();
                const target = this.getAttribute('href').substring(1);
                console.log("Admin sidebar link clicked:", target);
                
                // Call the appropriate function based on the link target
                switch(target) {
                    case 'home':
                        showHome();
                        break;
                    case 'students':
                        showStudents();
                        break;
                    case 'current-sit-in':
                        showCurrentSitIn();
                        break;
                    case 'view-sit-in-records':
                        showViewSitInRecords();
                        break;
                    case 'lab-schedule':
                        showLabScheduleAdmin();
                        break;
                    case 'reservation-approval':
                        showReservationApproval();
                        break;
                    case 'lab-resources':
                        showLabResources();
                        break;
                    case 'feedback-reports':
                        showFeedbackReports();
                        break;
                    case 'computer-control':
                        showComputerControl();
                        break;
                    default:
                        console.log("No handler for:", target);
                        break;
                }
                
                // Update active class on sidebar links
                document.querySelectorAll('.admin-sidebar a').forEach(l => {
                    l.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
    
    // Setup event listeners for student sidebar
    document.querySelectorAll('.student-sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#logout') {
                e.preventDefault();
                const target = this.getAttribute('href').substring(1);
                console.log("Student sidebar link clicked:", target);
                
                // Call the appropriate function based on the link target
                switch(target) {
                    case 'profile-section':
                        showStudentProfile();
                        break;
                    case 'rules':
                        showStudentRules();
                        break;
                    case 'lab-rules':
                        showLabRules();
                        break;
                    case 'history':
                        showStudentHistory();
                        break;
                    case 'reservation':
                        showStudentReservation();
                        break;
                    case 'student-lab-resources':
                        showStudentLabResources();
                        break;
                    case 'feedback':
                        showStudentFeedback();
                        break;
                    case 'lab-schedules':
                        showLabSchedules();
                        break;
                    default:
                        console.log("No handler for:", target);
                        break;
                }
                
                // Update active class on sidebar links
                document.querySelectorAll('.student-sidebar a').forEach(l => {
                    l.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
    
    // Debugging help - add to window object for console testing
    window.debugSections = function() {
        console.log("Admin sections:");
        document.querySelectorAll('.admin-section').forEach(section => {
            console.log(`- ${section.id} (display: ${getComputedStyle(section).display})`);
        });
        
        console.log("Student sections:");
        document.querySelectorAll('.section-placeholder, #profile-section').forEach(section => {
            console.log(`- ${section.id} (display: ${getComputedStyle(section).display})`);
        });
    };
});
</script>
EOD;

// Find </body> tag position
$body_end_pos = strrpos($content, '</body>');
if ($body_end_pos !== false) {
    // Insert our JavaScript code just before the </body> tag
    $content = substr($content, 0, $body_end_pos) . $js_code . substr($content, $body_end_pos);
    echo "Added improved module functions<br>";
} else {
    echo "Could not find </body> tag!<br>";
}

// Find and fix sidebar links for admin
$admin_sidebar_pattern = '/<div class="admin-sidebar">/';
if (preg_match($admin_sidebar_pattern, $content)) {
    // Add onclick attributes to admin sidebar links
    $content = preg_replace_callback(
        '/<a href="#(home|students|current-sit-in|view-sit-in-records|lab-schedule|reservation-approval|lab-resources|feedback-reports|computer-control)"[^>]*>/',
        function($matches) {
            $section = $matches[1];
            $function = '';
            
            switch($section) {
                case 'home':
                    $function = 'showHome()';
                    break;
                case 'students':
                    $function = 'showStudents()';
                    break;
                case 'current-sit-in':
                    $function = 'showCurrentSitIn()';
                    break;
                case 'view-sit-in-records':
                    $function = 'showViewSitInRecords()';
                    break;
                case 'lab-schedule':
                    $function = 'showLabScheduleAdmin()';
                    break;
                case 'reservation-approval':
                    $function = 'showReservationApproval()';
                    break;
                case 'lab-resources':
                    $function = 'showLabResources()';
                    break;
                case 'feedback-reports':
                    $function = 'showFeedbackReports()';
                    break;
                case 'computer-control':
                    $function = 'showComputerControl()';
                    break;
                default:
                    break;
            }
            
            if ($function) {
                return str_replace('<a href', '<a onclick="' . $function . '; return false;" href', $matches[0]);
            } else {
                return $matches[0];
            }
        },
        $content
    );
    echo "Fixed admin sidebar links<br>";
}

// Find and fix sidebar links for student
$student_sidebar_pattern = '/<div class="student-sidebar">/';
if (preg_match($student_sidebar_pattern, $content)) {
    // Add onclick attributes to student sidebar links
    $content = preg_replace_callback(
        '/<a href="#(profile-section|rules|lab-rules|history|reservation|student-lab-resources|feedback|lab-schedules)"[^>]*>/',
        function($matches) {
            $section = $matches[1];
            $function = '';
            
            switch($section) {
                case 'profile-section':
                    $function = 'showStudentProfile()';
                    break;
                case 'rules':
                    $function = 'showStudentRules()';
                    break;
                case 'lab-rules':
                    $function = 'showLabRules()';
                    break;
                case 'history':
                    $function = 'showStudentHistory()';
                    break;
                case 'reservation':
                    $function = 'showStudentReservation()';
                    break;
                case 'student-lab-resources':
                    $function = 'showStudentLabResources()';
                    break;
                case 'feedback':
                    $function = 'showStudentFeedback()';
                    break;
                case 'lab-schedules':
                    $function = 'showLabSchedules()';
                    break;
                default:
                    break;
            }
            
            if ($function) {
                return str_replace('<a href', '<a onclick="' . $function . '; return false;" href', $matches[0]);
            } else {
                return $matches[0];
            }
        },
        $content
    );
    echo "Fixed student sidebar links<br>";
}

// Save the fixed content
file_put_contents('homepage.php', $content);

// Final syntax check
$output = shell_exec("C:\\xampp\\php\\php.exe -l homepage.php 2>&1");
echo "<p><strong>Final syntax check result:</strong></p>";
echo "<pre>$output</pre>";

echo "<p><a href='homepage.php' style='display: inline-block; background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;'>Go to Homepage</a></p>";
?> 