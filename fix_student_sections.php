<?php
// Fix script for student sections
// This script fixes the student sections by editing homepage.php

// Read the file
$homepage_file = 'homepage.php';
$content = file_get_contents($homepage_file);

// Find and remove the duplicate hideAllStudentSections function
// The second function is around line 4833
$pattern = '/function hideAllStudentSections\(\) {\s*console\.log\(\'Direct hide all sections call\'\);.*?}\s*}\);/s';
$content = preg_replace($pattern, '});', $content);

// Make sure all student sections are properly defined and not duplicated
// Remove any duplicated sections
$sections_pattern = '/<div id="(profile-section|rules|lab-rules|history|reservation|student-lab-resources|feedback|lab-schedules)"[^>]*?>.*?<\/div>\s*<div id="\1"/s';
while(preg_match($sections_pattern, $content)) {
    $content = preg_replace($sections_pattern, '<div id="$1"', $content);
}

// Write the changes back to the file
file_put_contents($homepage_file, $content);

// Now let's add the proper JS functions for showing each student section
// Get the section of the file with the JavaScript section functions
$js_functions_pattern = '/function showStudentProfile\(\) {.*?hideAllStudentSections\(\);.*?}/s';
if (preg_match($js_functions_pattern, $content, $matches)) {
    // Make sure all the required functions exist
    $needs_functions = [];
    $js_sections = [
        ['showStudentRules', 'rules'],
        ['showLabRules', 'lab-rules'],
        ['showStudentHistory', 'history'],
        ['showStudentReservation', 'reservation'],
        ['showStudentLabResources', 'student-lab-resources'],
        ['showStudentFeedback', 'feedback'],
        ['showLabSchedules', 'lab-schedules']
    ];
    
    $js_code = $matches[0];
    
    // Check for each function and prepare to add any missing ones
    foreach ($js_sections as $section) {
        $function_name = $section[0];
        $section_id = $section[1];
        
        if (strpos($content, "function $function_name()") === false) {
            $needs_functions[] = <<<EOT
        
        function $function_name() {
            hideAllStudentSections();
            document.getElementById('$section_id').style.display = 'block';
        }
EOT;
        }
    }
    
    // If we need to add functions, add them after the showStudentProfile function
    if (!empty($needs_functions)) {
        $js_code .= implode('', $needs_functions);
        $content = str_replace($matches[0], $js_code, $content);
        file_put_contents($homepage_file, $content);
    }
}

echo "Fixed student sections in homepage.php!\n";
?> 