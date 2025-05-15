<?php
// Script to fix the unclosed curly brace in homepage.php

// First, create a backup
copy('homepage.php', 'homepage.php.fix_backup');

// Read the content
$content = file_get_contents('homepage.php');

// Add a closing brace just before the closing PHP tag at the end of the file
$fixed_content = str_replace('?>', '} ?>', $content);

// Write the fixed content back
file_put_contents('homepage.php', $fixed_content);

echo "Added a closing brace to the end of the file. Please check if this fixes the issue.";
?> 