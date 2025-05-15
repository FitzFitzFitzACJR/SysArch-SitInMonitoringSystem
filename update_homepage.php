<?php
// Script to update homepage.php with the new JavaScript files for locked status

// Create a backup of the current homepage
copy('homepage.php', 'homepage.php.backup-locks');
echo "Created backup at homepage.php.backup-locks\n";

// Read the homepage file
$homepage = file_get_contents('homepage.php');

// 1. Add our JavaScript files before the closing </body> tag
$script_tags = '
<!-- Include computer selection and lock status updates -->
<script src="js/computer_selection.js"></script>
<script src="js/lab_computers_update.js"></script>
';

$homepage = str_replace('</body>', "$script_tags\n</body>", $homepage);

// 2. Save the updated homepage
file_put_contents('homepage.php', $homepage);
echo "Updated homepage.php with dynamic computer selection and lock status support\n";

// 3. Create the js directory if it doesn't exist
if (!file_exists('js')) {
    mkdir('js', 0777, true);
    echo "Created js directory\n";
}

echo "Update complete!\n";
echo "Now you can go to homepage.php and the computer selection will dynamically update based on the selected laboratory and reflect locked computer status.\n";
?> 