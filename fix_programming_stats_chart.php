<?php
// This script improves the programming language usage statistics in the admin dashboard
// with a proper pie chart visualization

// Read the original file
$homepageContent = file_get_contents('homepage.php');

// Add Chart.js library to the head section
$headPattern = '/<\/head>/';
$chartJsReplacement = '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>';

$homepageContent = preg_replace($headPattern, $chartJsReplacement, $homepageContent);

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
                                           LIMIT 8";
                        $languages_result = mysqli_query($conn, $languages_query);
                        
                        if (mysqli_num_rows($languages_result) > 0) {
                            // Prepare data for chart
                            $languages = [];
                            $counts = [];
                            $colors = [];
                            
                            // Collect data for visualization
                            while ($language = mysqli_fetch_assoc($languages_result)) {
                                $languages[] = $language[\'language\'];
                                $counts[] = $language[\'count\'];
                                $colors[] = getLanguageColor($language[\'language\']);
                            }
                            
                            // Convert to JSON for JavaScript
                            $languages_json = json_encode($languages);
                            $counts_json = json_encode($counts);
                            $colors_json = json_encode($colors);
                            
                            // Display chart container with bar chart beside it
                            echo "<div style=\'display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px;\'>";
                            
                            // Pie chart container
                            echo "<div style=\'flex: 1; min-width: 300px;\'>";
                            echo "<canvas id=\'languagePieChart\' style=\'width: 100%; height: 250px;\'></canvas>";
                            echo "</div>";
                            
                            // Bar chart container
                            echo "<div style=\'flex: 1; min-width: 300px;\'>";
                            
                            // Calculate total for percentage
                            $total_count = array_sum($counts);
                            
                            // Display bar chart
                            for ($i = 0; $i < count($languages); $i++) {
                                $percentage = ($total_count > 0) ? round(($counts[$i] / $total_count) * 100) : 0;
                                
                                echo "<div class=\'language-item\'>";
                                echo "<div class=\'language-name\'>" . htmlspecialchars($languages[$i]) . "</div>";
                                echo "<div class=\'language-bar-container\'>";
                                echo "<div class=\'language-bar\' style=\'width: " . $percentage . "%; background-color: " . $colors[$i] . ";\'></div>";
                                echo "</div>";
                                echo "<div class=\'language-percentage\'>" . $percentage . "%</div>";
                                echo "</div>";
                            }
                            
                            echo "</div>";
                            echo "</div>";
                            
                            // Add JavaScript to initialize the chart
                            echo "<script>
                                document.addEventListener(\'DOMContentLoaded\', function() {
                                    const ctx = document.getElementById(\'languagePieChart\').getContext(\'2d\');
                                    const languagePieChart = new Chart(ctx, {
                                        type: \'pie\',
                                        data: {
                                            labels: $languages_json,
                                            datasets: [{
                                                data: $counts_json,
                                                backgroundColor: $colors_json,
                                                borderColor: \'white\',
                                                borderWidth: 2
                                            }]
                                        },
                                        options: {
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: \'bottom\',
                                                    labels: {
                                                        boxWidth: 12,
                                                        padding: 10,
                                                        font: {
                                                            size: 11
                                                        }
                                                    }
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function(context) {
                                                            const label = context.label || \'\';
                                                            const value = context.raw || 0;
                                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                            const percentage = Math.round((value / total) * 100);
                                                            return \`\${label}: \${value} (\${percentage}%)\`;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    });
                                });
                            </script>";
                        } else {
                            echo "<div style=\'text-align: center; padding: 30px; background-color: #f9f9f9; border-radius: 8px;\'>";
                            echo "<p style=\'margin-bottom: 10px; color: #666;\'>No programming language usage data available.</p>";
                            echo "<p style=\'font-size: 0.9em; color: #888;\'>Data will appear here when students use the system for programming activities.</p>";
                            echo "</div>";
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
$cssPattern = '/\/\* Programming Language Usage Statistics Styles \*\/.*?\.language-percentage \{.*?\}/s';
$cssReplacement = '/* Programming Language Usage Statistics Styles */
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
            height: 16px;
            background-color: #f0f0f0;
            border-radius: 8px;
            margin: 0 10px;
            overflow: hidden;
        }
        
        .language-bar {
            height: 100%;
            border-radius: 8px;
            transition: width 0.3s ease;
        }
        
        .language-percentage {
            width: 40px;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
        }';

// Check if the CSS pattern exists, if not add it to the style tag
if (strpos($homepageContent, '/* Programming Language Usage Statistics Styles */') !== false) {
    $homepageContent = preg_replace($cssPattern, $cssReplacement, $homepageContent);
} else {
    // Add the CSS to the style tag
    $stylePattern = '/<style>(.*?)<\/style>/s';
    $stylePrependReplacement = '<style>$1
        ' . $cssReplacement;
    $homepageContent = preg_replace($stylePattern, $stylePrependReplacement, $homepageContent);
}

// Write the updated content back to the file
file_put_contents('homepage.php', $homepageContent);

echo "Programming language usage statistics in the admin dashboard enhanced with pie chart visualization!";
?> 