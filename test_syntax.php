<?php
// Check for PHP syntax errors in homepage.php
$output = shell_exec("C:\\xampp\\php\\php.exe -l homepage.php 2>&1");
echo "<pre>$output</pre>";

// Count braces for balance check
$content = file_get_contents('homepage.php');
$open_braces = substr_count($content, '{');
$close_braces = substr_count($content, '}');
echo "<p>Open braces: $open_braces</p>";
echo "<p>Close braces: $close_braces</p>";
echo "<p>Difference: " . ($open_braces - $close_braces) . "</p>";
?> 