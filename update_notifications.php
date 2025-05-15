<?php
// Create a backup of the homepage.php file
copy('homepage.php', 'homepage.php.notifications_backup');

// Read the contents of homepage.php
$homepage_content = file_get_contents('homepage.php');

// Read the contents of student_notifications.php
$notifications_content = file_get_contents('student_notifications.php');

// Define the pattern to search for
$pattern = '/<div id="notifications" class="section-placeholder" style="display: none;">\s*<h2>Notifications<\/h2>\s*<p>This feature is coming soon.<\/p>\s*<\/div>/s';

// Replace the pattern with the content from student_notifications.php
$homepage_content = preg_replace($pattern, $notifications_content, $homepage_content);

// Write the updated content back to homepage.php
file_put_contents('homepage.php', $homepage_content);

echo "Notifications section updated successfully!";
?> 