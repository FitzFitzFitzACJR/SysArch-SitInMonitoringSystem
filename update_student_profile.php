<?php
// This script will update the student profile edit form in homepage.php

// Read the original file
$homepageContent = file_get_contents('homepage.php');

// Find the edit profile form's course select field
$pattern = '/(<select id="course" name="course" required.*?>).*?(<\/select>)/s';
$replacement = '$1
                        <option value="1" <?php echo ($user[\'course\'] == 1) ? \'selected\' : \'\'; ?>>BS Information Technology</option>
                        <option value="2" <?php echo ($user[\'course\'] == 2) ? \'selected\' : \'\'; ?>>BS Computer Science</option>
                        <option value="3" <?php echo ($user[\'course\'] == 3) ? \'selected\' : \'\'; ?>>BS Information Systems</option>
                        <option value="4" <?php echo ($user[\'course\'] == 4) ? \'selected\' : \'\'; ?>>BS Accountancy</option>
                        <option value="5" <?php echo ($user[\'course\'] == 5) ? \'selected\' : \'\'; ?>>BS Criminology</option>
                    $2';

// Update the content
$updatedContent = preg_replace($pattern, $replacement, $homepageContent);

// Write the updated content back to the file
if ($updatedContent !== $homepageContent) {
    file_put_contents('homepage.php', $updatedContent);
    echo "Edit profile form updated successfully with complete list of courses!";
} else {
    echo "Could not update the edit profile form. Pattern not found.";
}
?> 