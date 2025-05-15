<?php
// Analyze and fix brackets in homepage.php

// Create backup
copy('homepage.php', 'homepage.php.brackets_backup_' . time());
echo "Created backup of homepage.php<br>";

// Read the file
$content = file_get_contents('homepage.php');

// Find the problematic line (around line 4517)
$lines = explode("\n", $content);
$problem_line = isset($lines[4516]) ? $lines[4516] : 'Line not found';
echo "Problem line (4517): " . htmlspecialchars($problem_line) . "<br>";

// Check the lines around the problem
echo "Lines around the problem:<br><pre>";
for ($i = 4512; $i <= 4522; $i++) {
    if (isset($lines[$i-1])) {
        echo $i . ": " . htmlspecialchars($lines[$i-1]) . "\n";
    }
}
echo "</pre>";

// Find all closing braces without matching open braces
$processed_content = '';
$stack = [];
$line_number = 0;
$removed_braces = [];

foreach ($lines as $line_number => $line) {
    $line_number++; // Make it 1-indexed
    
    // Count braces in this line
    $open_count = substr_count($line, '{');
    $close_count = substr_count($line, '}');
    
    // Add open braces to stack
    for ($i = 0; $i < $open_count; $i++) {
        $stack[] = $line_number;
    }
    
    // Check closing braces
    for ($i = 0; $i < $close_count; $i++) {
        if (empty($stack)) {
            // Unmatched closing brace found
            $removed_braces[] = $line_number;
            $line = preg_replace('/\}/', '/* REMOVED UNMATCHED BRACE */', $line, 1);
        } else {
            // Pop matching open brace from stack
            array_pop($stack);
        }
    }
    
    $processed_content .= $line . "\n";
}

// Report results
echo "<p>Found " . count($removed_braces) . " unmatched closing braces on lines: " . implode(', ', $removed_braces) . "</p>";
echo "<p>Found " . count($stack) . " unmatched opening braces on lines: " . implode(', ', $stack) . "</p>";

// Fix additional common issues
$processed_content = str_replace('if (){', 'if (true) {', $processed_content);

// Save the fixed content
file_put_contents('homepage.php', $processed_content);

// Final syntax check
$output = shell_exec("C:\\xampp\\php\\php.exe -l homepage.php 2>&1");
echo "<p><strong>Final syntax check result:</strong></p>";
echo "<pre>$output</pre>";

echo "<p><a href='homepage.php' style='display: inline-block; background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;'>Go to Homepage</a></p>";
?> 