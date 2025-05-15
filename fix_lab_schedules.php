<?php
// This is a utility script to fix the homepage.php file
// It creates a new version of the file with only one set of includes for admin_lab_schedule.php and student_lab_schedule.php

// Read the current homepage.php file
$homepage = file_get_contents('homepage.php');

// Find the position of the body closing tag
$body_end_pos = strpos($homepage, '</body>');

// Remove any existing includes of the lab schedule files
$homepage = str_replace('<?php include \'admin_lab_schedule.php\'; ?>', '', $homepage);
$homepage = str_replace('<?php include \'student_lab_schedule.php\'; ?>', '', $homepage);

// Insert the includes just before the body closing tag
$start_part = substr($homepage, 0, $body_end_pos);
$end_part = substr($homepage, $body_end_pos);

// Create the fixed homepage content
$fixed_homepage = $start_part . "\n    <!-- Include lab schedule files -->\n    <?php include 'admin_lab_schedule.php'; ?>\n    <?php include 'student_lab_schedule.php'; ?>\n" . $end_part;

// Save it to a new file
file_put_contents('homepage.fixed.php', $fixed_homepage);

echo "Fixed homepage saved to homepage.fixed.php\n";
echo "To use it, rename homepage.fixed.php to homepage.php\n";
?> 