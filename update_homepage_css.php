<?php
// This script adds CSS for sit-in history statistics cards to homepage.php

// Read the original file
$homepageContent = file_get_contents('homepage.php');

// Look for the <style> tag
$styleStart = strpos($homepageContent, '<style>');
$styleEnd = strpos($homepageContent, '</style>', $styleStart);

if ($styleStart !== false && $styleEnd !== false) {
    // Extract the current style content
    $currentStyle = substr($homepageContent, $styleStart + 7, $styleEnd - $styleStart - 7);
    
    // Add our new styles
    $newStyles = $currentStyle . "
        /* Notification Badge */
        .notification-badge {
            display: inline-block;
            background-color: #E0B0FF;
            color: white;
            border-radius: 50%;
            padding: 2px 6px;
            font-size: 10px;
            position: relative;
            top: -5px;
            margin-left: 5px;
        }
        
        /* Sit-in History Statistics Cards */
        .statistics-cards {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .statistic-card {
            flex: 1;
            min-width: 200px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            padding: 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .statistic-card:before {
            content: \"\";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 5px;
        }
        
        .statistic-card.primary:before {
            background-color: #E0B0FF;
        }
        
        .statistic-card.secondary:before {
            background-color: #F7B4C6;
        }
        
        .statistic-card.tertiary:before {
            background-color: #B0E0E6;
        }
        
        .statistic-card .statistic-value {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
            color: #333;
        }
        
        .statistic-card .statistic-label {
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }";
    
    // Replace the style content
    $updatedContent = substr_replace($homepageContent, "<style>" . $newStyles . "</style>", $styleStart, $styleEnd - $styleStart + 8);
    
    // Write the updated content back to the file
    file_put_contents('homepage.php', $updatedContent);
    
    echo "CSS styles added successfully to homepage.php!";
} else {
    echo "Could not find style tag in homepage.php.";
}
?> 