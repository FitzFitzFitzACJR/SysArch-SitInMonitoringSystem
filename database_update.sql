-- Add updated_at column to reservations table
ALTER TABLE reservations ADD COLUMN updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP;

-- Add computer column to reservations table
ALTER TABLE reservations ADD COLUMN computer VARCHAR(50) NULL AFTER room;

-- Ensure sit_in_sessions table has duration column
ALTER TABLE sit_in_sessions ADD COLUMN duration INT NULL;

-- Make sure we have the student_feedback table
CREATE TABLE IF NOT EXISTS student_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    room VARCHAR(50) NOT NULL,
    rating INT(1) NOT NULL,
    feedback_type VARCHAR(50) NOT NULL,
    comments TEXT NOT NULL,
    suggestions TEXT,
    status ENUM('unread', 'read') DEFAULT 'unread',
    date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Make sure we have the attendance_leaderboard table
CREATE TABLE IF NOT EXISTS attendance_leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    attendance_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(idno) ON DELETE CASCADE
);

-- Make sure we have the points_log table
CREATE TABLE IF NOT EXISTS points_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    points_added INT,
    reason TEXT,
    sessions_added INT,
    added_by VARCHAR(20),
    added_on DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(idno) ON DELETE CASCADE
);

-- Make sure lab_resources table exists
CREATE TABLE IF NOT EXISTS lab_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    link VARCHAR(512) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Make sure we have the announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    content TEXT,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(20),
    status ENUM('active', 'inactive') DEFAULT 'active'
);

-- Create uploads directory for resources if needed (this is a reminder, not SQL)
-- PHP: mkdir("uploads/resources", 0777, true); 