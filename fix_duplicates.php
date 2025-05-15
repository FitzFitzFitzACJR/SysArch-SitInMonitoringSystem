<?php
// Fix script for student sections
// This script fixes the student sections by removing duplicates from homepage.php

// Read the homepage.php file
$homepage_file = 'homepage.php';
$content = file_get_contents($homepage_file);

// Backup the file first
file_put_contents($homepage_file . '.backup', $content);
echo "Backup created: homepage.php.backup<br>";

// Remove the duplicate sections at the end of the file
$pattern = '/<div id="student-lab-resources" class="section-placeholder".*?<\/div>\s*<div id="feedback" class="section-placeholder".*?<\/div>\s*<div id="profile-section" class="section-placeholder".*?<\/div>\s*<div id="history" class="section-placeholder".*?<\/div>\s*<div id="reservation" class="section-placeholder".*?<\/div>\s*<div id="feedback" class="section-placeholder".*?<\/div>\s*<div id="student-lab-resources" class="section-placeholder".*?<\/div>/s';
$replacement = '<?php 
// Include student sections file for student users
if (!isset($_SESSION[\'is_admin\']) || !$_SESSION[\'is_admin\']) {
    include \'student_sections.php\';
}
?>';

$content = preg_replace($pattern, $replacement, $content);

// Make sure the student_sections.php include is in the correct place
$include_pattern = '/include \'student_sections.php\';/';
if (!preg_match($include_pattern, $content)) {
    $content = str_replace('<?php } ?>', '<?php } 
// Include student sections file for student users
if (!isset($_SESSION[\'is_admin\']) || !$_SESSION[\'is_admin\']) {
    include \'student_sections.php\';
}
?>', $content);
}

// Save the file
file_put_contents($homepage_file, $content);
echo "Fixed homepage.php file - removed duplicate sections and added include for student_sections.php<br>";

echo "<a href='homepage.php'>Go back to homepage</a>";
?> 