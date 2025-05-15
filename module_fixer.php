<?php
session_start();

// Check if user is admin
if (!isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
    die("Access denied. Only administrators can access this tool.");
}

// Handle form submission
if (isset($_POST['fix'])) {
    // Create backup
    $backup_name = 'homepage.php.fixerbackup_' . time();
    copy('homepage.php', $backup_name);
    
    // Read the file
    $content = file_get_contents('homepage.php');
    
    // Perform fixes
    $fixes_applied = [];
    
    // Fix 1: Ensure proper jQuery inclusion
    $jquery_check = '<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>';
    if (strpos($content, $jquery_check) === false) {
        $content = str_replace('</head>', $jquery_check . "\n</head>", $content);
        $fixes_applied[] = "Added jQuery";
    }
    
    // Fix 2: Ensure proper closing of admin section
    $admin_start = '<?php if (isset($_SESSION[\'is_admin\']) && $_SESSION[\'is_admin\']) { ?>';
    $admin_end = '<?php } ?>';
    if (strpos($content, $admin_start) !== false && strpos($content, $admin_end) === false) {
        // Find admin dashboard end
        $admin_end_pattern = '<!-- End Computer Control Section -->\s*\n\s*</div>\s*\n\s*</div>\s*\n\s*</div>';
        $content = preg_replace('/'. $admin_end_pattern .'/', "<!-- End Computer Control Section -->\n\n            </div>\n        </div>\n    </div>\n    " . $admin_end, $content);
        $fixes_applied[] = "Fixed admin section closure";
    }
    
    // Fix 3: Add essential JavaScript functions for modules
    $js_functions = '
<script>
// Essential module functions
document.addEventListener("DOMContentLoaded", function() {
    console.log("Module functions initialized");
    
    // Define admin section functions if they don\'t exist
    if (typeof hideAllAdminSections !== "function") {
        window.hideAllAdminSections = function() {
            document.querySelectorAll(".admin-section, .admin-dashboard > div").forEach(section => {
                section.style.display = "none";
            });
        };
    }
    
    // Define student section functions if they don\'t exist
    if (typeof hideAllStudentSections !== "function") {
        window.hideAllStudentSections = function() {
            document.querySelectorAll(".section-placeholder, #profile-section").forEach(section => {
                section.style.display = "none";
            });
        };
    }
    
    // Student section functions
    if (typeof showStudentProfile !== "function") {
        window.showStudentProfile = function() {
            hideAllStudentSections();
            document.getElementById("profile-section").style.display = "block";
        };
    }
    
    if (typeof showStudentRules !== "function") {
        window.showStudentRules = function() {
            hideAllStudentSections();
            document.getElementById("rules").style.display = "block";
        };
    }
    
    if (typeof showLabRules !== "function") {
        window.showLabRules = function() {
            hideAllStudentSections();
            document.getElementById("lab-rules").style.display = "block";
        };
    }
    
    if (typeof showStudentHistory !== "function") {
        window.showStudentHistory = function() {
            hideAllStudentSections();
            document.getElementById("history").style.display = "block";
        };
    }
    
    if (typeof showStudentReservation !== "function") {
        window.showStudentReservation = function() {
            hideAllStudentSections();
            document.getElementById("reservation").style.display = "block";
        };
    }
    
    if (typeof showStudentLabResources !== "function") {
        window.showStudentLabResources = function() {
            hideAllStudentSections();
            document.getElementById("student-lab-resources").style.display = "block";
        };
    }
    
    if (typeof showStudentFeedback !== "function") {
        window.showStudentFeedback = function() {
            hideAllStudentSections();
            document.getElementById("feedback").style.display = "block";
        };
    }
    
    if (typeof showLabSchedules !== "function") {
        window.showLabSchedules = function() {
            hideAllStudentSections();
            document.getElementById("lab-schedules").style.display = "block";
        };
    }
    
    // Computer Control module function
    if (typeof showComputerControl !== "function") {
        window.showComputerControl = function() {
            hideAllAdminSections();
            document.getElementById("computer-control").style.display = "block";
            if (typeof loadControlComputers === "function") {
                loadControlComputers();
            }
        };
    }
});
</script>';

    // Check if we need to add these functions
    if (strpos($content, 'hideAllAdminSections') === false || 
        strpos($content, 'hideAllStudentSections') === false) {
        // Insert before </body>
        $body_end_pos = strrpos($content, '</body>');
        if ($body_end_pos !== false) {
            $content = substr($content, 0, $body_end_pos) . $js_functions . substr($content, $body_end_pos);
            $fixes_applied[] = "Added essential module functions";
        }
    }
    
    // Fix 4: Add onclick handlers to sidebar links if missing
    // Check a sample link first
    if (strpos($content, '<a href="#profile-section" onclick="showStudentProfile()') === false) {
        // Add onclick handlers to student links
        $content = preg_replace(
            '/<a href="#(profile-section)"([^>]*)>/',
            '<a href="#$1" onclick="showStudentProfile(); return false;"$2>',
            $content
        );
        $content = preg_replace(
            '/<a href="#(rules)"([^>]*)>/',
            '<a href="#$1" onclick="showStudentRules(); return false;"$2>',
            $content
        );
        $content = preg_replace(
            '/<a href="#(lab-rules)"([^>]*)>/',
            '<a href="#$1" onclick="showLabRules(); return false;"$2>',
            $content
        );
        $content = preg_replace(
            '/<a href="#(history)"([^>]*)>/',
            '<a href="#$1" onclick="showStudentHistory(); return false;"$2>',
            $content
        );
        $content = preg_replace(
            '/<a href="#(reservation)"([^>]*)>/',
            '<a href="#$1" onclick="showStudentReservation(); return false;"$2>',
            $content
        );
        $content = preg_replace(
            '/<a href="#(student-lab-resources)"([^>]*)>/',
            '<a href="#$1" onclick="showStudentLabResources(); return false;"$2>',
            $content
        );
        $content = preg_replace(
            '/<a href="#(feedback)"([^>]*)>/',
            '<a href="#$1" onclick="showStudentFeedback(); return false;"$2>',
            $content
        );
        $content = preg_replace(
            '/<a href="#(lab-schedules)"([^>]*)>/',
            '<a href="#$1" onclick="showLabSchedules(); return false;"$2>',
            $content
        );
        
        $fixes_applied[] = "Added onclick handlers to student sidebar links";
    }
    
    // Check admin links
    if (strpos($content, '<a href="#computer-control" onclick="showComputerControl()') === false) {
        // Add onclick handler for Computer Control specifically
        $content = preg_replace(
            '/<a href="#(computer-control)"([^>]*)>/',
            '<a href="#$1" onclick="showComputerControl(); return false;"$2>',
            $content
        );
        
        $fixes_applied[] = "Added onclick handler for Computer Control link";
    }
    
    // Fix 5: Make sure there's only one computer control module inclusion
    $computer_module_include = '<?php include "computer_control_module.php"; ?>';
    $control_module_count = substr_count($content, $computer_module_include);
    if ($control_module_count > 1) {
        // Remove all occurrences and add just one at the bottom of the head
        $content = str_replace($computer_module_include, '', $content);
        $content = str_replace('</head>', $computer_module_include . "\n</head>", $content);
        $fixes_applied[] = "Fixed multiple computer control module includes";
    } else if ($control_module_count === 0) {
        // Add the module if it's missing
        $content = str_replace('</head>', $computer_module_include . "\n</head>", $content);
        $fixes_applied[] = "Added missing computer control module include";
    }
    
    // Save the fixed content
    file_put_contents('homepage.php', $content);
    
    // Final syntax check
    $output = shell_exec("C:\\xampp\\php\\php.exe -l homepage.php 2>&1");
    $syntax_check = (strpos($output, 'No syntax errors detected') !== false) ? 
        "<span style='color: green;'>No syntax errors detected</span>" : 
        "<span style='color: red;'>" . htmlspecialchars($output) . "</span>";
    
    $success_message = "Fixes applied successfully! A backup was created at: $backup_name";
    $fixes_list = !empty($fixes_applied) ? implode("<br>", $fixes_applied) : "No fixes needed";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Module Fixer Tool</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
        }
        .section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .btn {
            display: inline-block;
            padding: 8px 15px;
            background-color: #E0B0FF;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #e8f5e9;
            border-radius: 5px;
        }
        .error {
            background-color: #ffebee;
        }
        .nav-links {
            margin-top: 20px;
        }
        .nav-links a {
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Module Fixer Tool</h1>
        
        <div class="section">
            <h2>Homepage Module Fixer</h2>
            <p>This tool will fix common issues with the homepage modules:</p>
            <ul>
                <li>Ensure proper jQuery inclusion</li>
                <li>Fix admin section closure</li>
                <li>Add essential JavaScript functions for modules</li>
                <li>Add missing onclick handlers to sidebar links</li>
                <li>Fix computer control module inclusion</li>
            </ul>
            
            <form method="post">
                <button type="submit" name="fix" class="btn">Fix Homepage Modules</button>
            </form>
        </div>
        
        <?php if (isset($success_message)): ?>
        <div class="result">
            <h3>Result</h3>
            <p><?php echo $success_message; ?></p>
            <p><strong>Fixes applied:</strong><br><?php echo $fixes_list; ?></p>
            <p><strong>Syntax check:</strong> <?php echo $syntax_check; ?></p>
        </div>
        <?php endif; ?>
        
        <div class="nav-links">
            <a href="homepage.php" class="btn">Return to Homepage</a>
            <a href="test_computer_module.php" class="btn" style="background-color: #78909c;">Test Computer Module</a>
        </div>
    </div>
</body>
</html> 