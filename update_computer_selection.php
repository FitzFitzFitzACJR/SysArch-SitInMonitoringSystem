<?php
// Script to update homepage.php with the new computer selection system

// Create a backup of the current homepage
copy('homepage.php', 'homepage.php.backup-computer-selection');
echo "Created backup at homepage.php.backup-computer-selection\n";

// Read the homepage file
$homepage = file_get_contents('homepage.php');

// 1. First add our JavaScript file before the closing </body> tag
$script_tag = '<script src="js/computer_selection.js"></script>';
$homepage = str_replace('</body>', "$script_tag\n</body>", $homepage);

// 2. Now update the sit-in form to use our dynamic computer selection
// Try multiple patterns to find the computer dropdown in the sit-in form
$sit_in_patterns = [
    '/<div class="form-group">\s*<label for="computer_id">Computer:<\/label>\s*<select name="computer_id" id="computer_id"[^>]*>.*?<\/select>\s*<\/div>/s',
    '/<div[^>]*>\s*<label[^>]*>Computer[^<]*<\/label>\s*<select[^>]*name="computer_id"[^>]*>.*?<\/select>\s*<\/div>/s',
    '/<label[^>]*>Computer[^<]*<\/label>\s*<select[^>]*name="computer_id"[^>]*>.*?<\/select>/s'
];

$sit_in_replacement = '
<div class="form-group">
    <label for="computer_id">Computer:</label>
    <div id="computer_selection_container">
        <select name="computer_id" id="computer_id" class="form-control" required disabled>
            <option value="">Select a Laboratory First</option>
        </select>
    </div>
</div>';

$sit_in_replaced = false;
foreach ($sit_in_patterns as $pattern) {
    if (preg_match($pattern, $homepage)) {
        $homepage = preg_replace($pattern, $sit_in_replacement, $homepage);
        $sit_in_replaced = true;
        break;
    }
}

if (!$sit_in_replaced) {
    echo "WARNING: Could not find computer_id field in sit-in form. Manual updates may be needed.\n";
}

// 3. Now update the reservation form to use our dynamic computer selection
// Try multiple patterns to find the computer dropdown in the reservation form
$reservation_patterns = [
    '/<div class="form-group">\s*<label for="computer">Computer \(Optional\):<\/label>\s*<select name="computer"[^>]*>.*?<\/select>\s*<\/div>/s',
    '/<div[^>]*>\s*<label[^>]*>Computer[^<]*<\/label>\s*<select[^>]*name="computer"[^>]*>.*?<\/select>\s*<\/div>/s',
    '/<label[^>]*>Computer[^<]*<\/label>\s*<select[^>]*name="computer"[^>]*>.*?<\/select>/s'
];

$reservation_replacement = '
<div class="form-group">
    <label for="computer">Computer:</label>
    <div id="reservation_computer_container">
        <select name="computer" id="computer" class="form-control" required disabled>
            <option value="">Select a Laboratory First</option>
        </select>
    </div>
</div>';

$reservation_replaced = false;
foreach ($reservation_patterns as $pattern) {
    if (preg_match($pattern, $homepage)) {
        $homepage = preg_replace($pattern, $reservation_replacement, $homepage);
        $reservation_replaced = true;
        break;
    }
}

if (!$reservation_replaced) {
    echo "WARNING: Could not find computer field in reservation form. Manual updates may be needed.\n";
}

// 4. Save the updated homepage
file_put_contents('homepage.php', $homepage);
echo "Updated homepage.php with dynamic computer selection\n";

// 5. Create the js directory if it doesn't exist
if (!file_exists('js')) {
    mkdir('js', 0777, true);
    echo "Created js directory\n";
}

echo "Update complete!\n";
echo "Now you can go to homepage.php and the computer selection will dynamically update based on the selected laboratory and reflect locked computer status.\n";
?> 