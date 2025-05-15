<?php
// Fix modules script - this will correct common issues in the homepage.php file

// 1. Create backup
copy('homepage.php', 'homepage.php.modules_backup_' . time());
echo "Created backup of homepage.php<br>";

// 2. Read the file
$content = file_get_contents('homepage.php');

// 3. Fix common issues

// Fix 1: Ensure proper closure of main admin if statement
$pattern = '/\<\?php if \(isset\(\$_SESSION\[\'is_admin\'\]\) \&\& \$_SESSION\[\'is_admin\'\]\) \{ \?\>/';
$replacement = '<?php if (isset($_SESSION[\'is_admin\']) && $_SESSION[\'is_admin\']) { ?>';
$content = preg_replace($pattern, $replacement, $content);

// Find end of admin section and ensure it's properly closed
$admin_end_pattern = '/\<\!-- End Computer Control Section --\>\s*\<\/div\>\s*\<\/div\>\s*\<\/div\>/';
if (preg_match($admin_end_pattern, $content)) {
    $content = preg_replace($admin_end_pattern, '<!-- End Computer Control Section -->

            </div>
        </div>
    </div>
    <?php } ?>', $content);
    echo "Fixed admin section closure<br>";
}

// Fix 2: Ensure jQuery is loaded before any other scripts
$jquery_check = '<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>';
if (strpos($content, $jquery_check) === false) {
    // Add jQuery to head
    $content = str_replace('</head>', $jquery_check . "\n</head>", $content);
    echo "Added jQuery<br>";
}

// Fix 3: Ensure all admin and student section JavaScript is properly defined
$js_sections = <<<'EOD'
<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Admin section toggle functions
        if (document.querySelector('.admin-sidebar')) {
            console.log("Admin sidebar found, setting up admin functions");
            
            // Define function to hide all admin sections
            window.hideAllAdminSections = function() {
                document.querySelectorAll('.admin-section, .admin-dashboard > div').forEach(section => {
                    section.style.display = 'none';
                });
            };
            
            // Set up event handlers for admin sidebar links
            document.querySelectorAll('.admin-sidebar a').forEach(link => {
                link.addEventListener('click', function(e) {
                    const target = this.getAttribute('href').substring(1);
                    if (target !== 'logout') {
                        e.preventDefault();
                        console.log("Admin link clicked:", target);
                        
                        // Hide all sections
                        hideAllAdminSections();
                        
                        // Show target section
                        const targetSection = document.getElementById(target);
                        if (targetSection) {
                            targetSection.style.display = 'block';
                        }
                        
                        // Update active link
                        document.querySelectorAll('.admin-sidebar a').forEach(l => {
                            l.classList.remove('active');
                        });
                        this.classList.add('active');
                    }
                });
            });
        }
        
        // Student section toggle functions
        if (document.querySelector('.student-sidebar')) {
            console.log("Student sidebar found, setting up student functions");
            
            // Define function to hide all student sections
            window.hideAllStudentSections = function() {
                console.log('Hiding all student sections');
                document.querySelectorAll('.section-placeholder, #profile-section').forEach(section => {
                    section.style.display = 'none';
                });
            };
            
            // Set up event handlers for student sidebar links
            document.querySelectorAll('.student-sidebar a').forEach(link => {
                link.addEventListener('click', function(e) {
                    const target = this.getAttribute('href').substring(1);
                    if (target !== 'logout') {
                        e.preventDefault();
                        console.log("Student link clicked:", target);
                        
                        // Hide all sections
                        hideAllStudentSections();
                        
                        // Show target section
                        const targetSection = document.getElementById(target);
                        if (targetSection) {
                            targetSection.style.display = 'block';
                            console.log("Showing section:", target);
                        } else {
                            console.error("Section not found:", target);
                        }
                        
                        // Update active link
                        document.querySelectorAll('.student-sidebar a').forEach(l => {
                            l.classList.remove('active');
                        });
                        this.classList.add('active');
                    }
                });
            });
            
            // Define specific section toggle functions
            window.showStudentProfile = function() {
                hideAllStudentSections();
                document.getElementById('profile-section').style.display = 'block';
            };
            
            window.showStudentRules = function() {
                hideAllStudentSections();
                document.getElementById('rules').style.display = 'block';
            };
            
            window.showLabRules = function() {
                hideAllStudentSections();
                document.getElementById('lab-rules').style.display = 'block';
            };
            
            window.showStudentHistory = function() {
                hideAllStudentSections();
                document.getElementById('history').style.display = 'block';
            };
            
            window.showStudentReservation = function() {
                hideAllStudentSections();
                document.getElementById('reservation').style.display = 'block';
            };
            
            window.showStudentLabResources = function() {
                hideAllStudentSections();
                document.getElementById('student-lab-resources').style.display = 'block';
            };
            
            window.showStudentFeedback = function() {
                hideAllStudentSections();
                document.getElementById('feedback').style.display = 'block';
            };
            
            window.showLabSchedules = function() {
                hideAllStudentSections();
                document.getElementById('lab-schedules').style.display = 'block';
            };
        }
        
        // Setup Computer Control module
        if (document.getElementById('computer-control')) {
            console.log("Computer Control module found, initializing");
            
            // Add event listener for the sidebar link
            const computerControlLink = document.querySelector('a[href="#computer-control"]');
            if (computerControlLink) {
                computerControlLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    hideAllAdminSections();
                    document.getElementById('computer-control').style.display = 'block';
                    
                    // Load computers for the first time
                    const labSelector = document.getElementById('controlLabSelector');
                    if (labSelector && typeof loadControlComputers === 'function') {
                        loadControlComputers();
                    }
                });
            }
        }
    });
</script>
EOD;

// Add this script block before the body closing tag
$body_end_pos = strrpos($content, '</body>');
$content = substr_replace($content, $js_sections . "\n", $body_end_pos, 0);
echo "Added unified JavaScript functions<br>";

// Fix 4: Make sure there's only one computer control module inclusion
$computer_module_include = '<?php include "computer_control_module.php"; ?>';
$control_module_count = substr_count($content, $computer_module_include);
if ($control_module_count > 1) {
    // Remove all occurrences and add just one at the bottom of the head
    $content = str_replace($computer_module_include, '', $content);
    $content = str_replace('</head>', $computer_module_include . "\n</head>", $content);
    echo "Fixed multiple computer control module includes<br>";
}

// 4. Write the fixed content
file_put_contents('homepage.php', $content);
echo "Homepage.php has been fixed. Please refresh your browser to see the changes.<br>";

// 5. Test the syntax of the updated file
$output = shell_exec("C:\\xampp\\php\\php.exe -l homepage.php 2>&1");
echo "<p><strong>Syntax check result:</strong></p>";
echo "<pre>$output</pre>";

echo "<p><a href='homepage.php' style='display: inline-block; background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;'>Go to Homepage</a></p>";
?> 