<?php
// This script improves the programming language usage statistics in the admin dashboard

// Read the original file
$homepageContent = file_get_contents('homepage.php');

// Find the programming language usage statistics section
$pattern = '/<!-- Programming Language Usage Statistics -->(.*?)<!-- End Programming Language Usage Statistics -->/s';
$replacement = '<!-- Programming Language Usage Statistics -->
                    <div class="admin-card-content">
                        <h3>Programming Language Usage</h3>
                        
                        <?php
                        // Get programming language usage data with better SQL query
                        $languages_query = "SELECT 
                                               purpose AS language, 
                                               COUNT(*) AS count 
                                           FROM sit_in_sessions 
                                           WHERE purpose LIKE \'%Programming%\'
                                           OR purpose LIKE \'%Coding%\'
                                           OR purpose LIKE \'%Development%\'
                                           OR purpose IN (\'Java\', \'Python\', \'C++\', \'JavaScript\', \'PHP\', \'C#\', \'HTML/CSS\', \'SQL\', \'Ruby\', \'Swift\', \'Kotlin\', \'Go\', \'TypeScript\', \'Rust\')
                                           GROUP BY purpose
                                           ORDER BY count DESC
                                           LIMIT 5";
                        $languages_result = mysqli_query($conn, $languages_query);
                        
                        if (mysqli_num_rows($languages_result) > 0) {
                            echo "<div class=\'language-stats\'>";
                            
                            // Calculate total for percentage
                            $total_count_query = "SELECT COUNT(*) as total FROM sit_in_sessions 
                                                 WHERE purpose LIKE \'%Programming%\'
                                                 OR purpose LIKE \'%Coding%\'
                                                 OR purpose LIKE \'%Development%\'
                                                 OR purpose IN (\'Java\', \'Python\', \'C++\', \'JavaScript\', \'PHP\', \'C#\', \'HTML/CSS\', \'SQL\', \'Ruby\', \'Swift\', \'Kotlin\', \'Go\', \'TypeScript\', \'Rust\')";
                            $total_count_result = mysqli_query($conn, $total_count_query);
                            $total_count = mysqli_fetch_assoc($total_count_result)[\'total\'];
                            
                            while ($language = mysqli_fetch_assoc($languages_result)) {
                                $lang_name = $language[\'language\'];
                                $lang_count = $language[\'count\'];
                                $percentage = ($total_count > 0) ? round(($lang_count / $total_count) * 100) : 0;
                                
                                // Determine color based on language
                                $color = getLanguageColor($lang_name);
                                
                                echo "<div class=\'language-item\'>";
                                echo "<div class=\'language-name\'>" . htmlspecialchars($lang_name) . "</div>";
                                echo "<div class=\'language-bar-container\'>";
                                echo "<div class=\'language-bar\' style=\'width: " . $percentage . "%; background-color: " . $color . ";\'></div>";
                                echo "</div>";
                                echo "<div class=\'language-percentage\'>" . $percentage . "%</div>";
                                echo "</div>";
                            }
                            
                            echo "</div>";
                        } else {
                            echo "<p>No programming language usage data available.</p>";
                        }
                        
                        // Function to determine color based on language name
                        function getLanguageColor($language) {
                            $language = strtolower($language);
                            
                            if (strpos($language, \'java\') !== false && strpos($language, \'script\') === false) {
                                return "#b07219"; // Java color
                            } elseif (strpos($language, \'python\') !== false) {
                                return "#3572A5"; // Python color
                            } elseif (strpos($language, \'c++\') !== false) {
                                return "#f34b7d"; // C++ color
                            } elseif (strpos($language, \'javascript\') !== false) {
                                return "#f1e05a"; // JavaScript color
                            } elseif (strpos($language, \'php\') !== false) {
                                return "#4F5D95"; // PHP color
                            } elseif (strpos($language, \'c#\') !== false) {
                                return "#178600"; // C# color
                            } elseif (strpos($language, \'html\') !== false || strpos($language, \'css\') !== false) {
                                return "#e34c26"; // HTML/CSS color
                            } elseif (strpos($language, \'sql\') !== false) {
                                return "#e38c00"; // SQL color
                            } elseif (strpos($language, \'ruby\') !== false) {
                                return "#701516"; // Ruby color
                            } elseif (strpos($language, \'swift\') !== false) {
                                return "#ffac45"; // Swift color
                            } elseif (strpos($language, \'kotlin\') !== false) {
                                return "#A97BFF"; // Kotlin color
                            } elseif (strpos($language, \'go\') !== false) {
                                return "#00ADD8"; // Go color
                            } elseif (strpos($language, \'typescript\') !== false) {
                                return "#2b7489"; // TypeScript color
                            } elseif (strpos($language, \'rust\') !== false) {
                                return "#dea584"; // Rust color
                            } else {
                                // Default colors for other languages or purposes
                                $colors = ["#6e5494", "#6C8EBF", "#D9534F", "#5CB85C", "#5BC0DE", "#F0AD4E"];
                                return $colors[abs(crc32($language)) % count($colors)];
                            }
                        }
                        ?>
                    </div>
                <!-- End Programming Language Usage Statistics -->';

$homepageContent = preg_replace($pattern, $replacement, $homepageContent);

// Add CSS for the language usage statistics
$cssPattern = '/<style>(.*?)<\/style>/s';
$cssReplacement = '<style>$1
        /* Programming Language Usage Statistics Styles */
        .language-stats {
            margin-top: 15px;
        }
        
        .language-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .language-name {
            width: 120px;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .language-bar-container {
            flex-grow: 1;
            height: 20px;
            background-color: #f0f0f0;
            border-radius: 10px;
            margin: 0 10px;
            overflow: hidden;
        }
        
        .language-bar {
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        
        .language-percentage {
            width: 40px;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
        }
    </style>';

$homepageContent = preg_replace($cssPattern, $cssReplacement, $homepageContent);

// Write the updated content back to the file
file_put_contents('homepage.php', $homepageContent);

echo "Programming language usage statistics in the admin dashboard improved successfully!";
?> 