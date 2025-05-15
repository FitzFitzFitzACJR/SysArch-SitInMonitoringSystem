<?php
// Create a new homepage file with fixed includes
$fixed_content = <<<'EOT'
    <script>
        function updateFileName(input) {
            const fileName = input.files[0] ? input.files[0].name : 'No file chosen';
            document.getElementById('file-name-display').textContent = fileName;
        }
        
        // Update closeEditProfileModal function
        function closeEditProfileModal() {
            document.getElementById('editProfileModal').style.display = 'none';
        }
    </script>
    
    <!-- Admin functions for lab schedule -->
    <script>
        function showLabSchedule() {
            // Hide all admin sections
            const adminSections = document.querySelectorAll('.home-section, .section-placeholder');
            adminSections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show lab schedule section
            document.getElementById('lab-schedule').style.display = 'block';
            
            // Update active link
            const navLinks = document.querySelectorAll('.sidebar ul li a');
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector('.sidebar ul li a[href="#lab-schedule"]').classList.add('active');
        }
    </script>
    
    <!-- Debugging script -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log("Debugging student sidebar links...");
            
            if (!document.querySelector('.sidebar')) {
                console.error("Sidebar not found!");
                return;
            }
            
            // Check if we're on the student page
            if (!document.getElementById('profile-section')) {
                console.log("Not on student page, skipping checks");
                return;
            }
            
            // Check all student sidebar links
            const links = document.querySelectorAll('.sidebar ul li a');
            console.log("Found " + links.length + " sidebar links");
            
            links.forEach(link => {
                console.log("Link:", link.innerText, "onclick:", link.getAttribute('onclick'));
                
                // Add a direct click handler to log when links are clicked
                link.addEventListener('click', function(e) {
                    console.log("CLICKED:", this.innerText);
                });
            });
            
            // Check if all student sections exist
            const sections = [
                'profile-section', 'rules', 'lab-rules', 'history', 
                'reservation', 'lab-resources', 'feedback'
            ];
            
            sections.forEach(section => {
                const el = document.getElementById(section);
                console.log("Section", section, "exists:", !!el);
            });
            
            // Add a global direct toggle function for manual testing
            window.toggleStudentSection = function(sectionId) {
                // Hide all sections
                document.querySelectorAll('.section-placeholder, #profile-section').forEach(section => {
                    section.style.display = 'none';
                });
                
                // Show the requested section
                const section = document.getElementById(sectionId);
                if (section) {
                    section.style.display = 'block';
                    console.log("Manually toggled section:", sectionId);
                } else {
                    console.error("Cannot find section:", sectionId);
                }
            };
            
            console.log("Use toggleStudentSection('section-id') in the console to manually show a section");
            
            // Add a function to list all sections on the page
            window.listAllSections = function() {
                console.log("All sections on the page:");
                document.querySelectorAll('div[id]').forEach(div => {
                    console.log(`- ${div.id} (display: ${div.style.display})`);
                });
            };
            
            // Execute it once at startup
            listAllSections();
        });
    </script>
    
    <!-- Include lab schedule files (only once) -->
    <?php include 'admin_lab_schedule.php'; ?>
    <?php include 'student_lab_schedule.php'; ?>
</body>
</html>
EOT;

// Get the current homepage content
$current_homepage = file_get_contents('homepage.php');

// Find position of </body>
$body_pos = strpos($current_homepage, '</body>');

// Replace everything from </body> to end with the fixed content
$new_homepage = substr($current_homepage, 0, $body_pos) . $fixed_content;

// Write to a new file
file_put_contents('homepage.fixed.php', $new_homepage);

echo "Fixed homepage created at homepage.fixed.php\n";
echo "You can review it and then rename it to homepage.php if it looks good.\n";

// Script to fix the unclosed curly brace in homepage.php
// Run this script to check and fix the issue

// Backup the original file
$original = file_get_contents('homepage.php');
file_put_contents('homepage.php.backup-' . time(), $original);
echo "Created backup of homepage.php\n";

// Problem is at line 3508 in the sit-in records section where there might be a missing closing brace
// Let's find and fix all non-matching curly braces

$content = $original;
$lines = explode("\n", $content);

// Check for basic PHP syntax
$cleaned_content = preg_replace('/\?>.*?<\?php/s', '; ', $content);
$tmp_file = 'temp_check.php';
file_put_contents($tmp_file, $cleaned_content);

// Try to detect the issue
$output = shell_exec("php -l $tmp_file 2>&1");
echo "PHP syntax check result: " . $output . "\n";

// Fix a common issue: misaligned section-header closing div
if (strpos($content, '</div>
                                    </div>') !== false) {
    $content = str_replace('</div>
                                    </div>', '</div>
                    </div>', $content);
    echo "Fixed misaligned closing div tags\n";
}

// Remove the temp file
unlink($tmp_file);

// Save the fixed content
file_put_contents('homepage.php', $content);
echo "File updated. Please check it again for syntax errors.\n";
?> 