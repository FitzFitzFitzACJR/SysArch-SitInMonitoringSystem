-- Add remaining_sessions column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS remaining_sessions INT DEFAULT 10;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(15) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status TINYINT(1) DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES users(idno) ON DELETE CASCADE
);

-- Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(15) NOT NULL,
    room VARCHAR(50) NOT NULL,
    rating INT NOT NULL,
    feedback_text TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES users(idno) ON DELETE CASCADE
);

-- Add room column to sit_in_records table if it doesn't exist
ALTER TABLE sit_in_records ADD COLUMN IF NOT EXISTS room VARCHAR(50) DEFAULT 'Lab 1';

-- Rename language_used to purpose in sit_in_records table if needed
-- Note: This is a bit more complex and may require data migration
-- This is a placeholder, should be executed with caution:
-- ALTER TABLE sit_in_records CHANGE COLUMN language_used purpose VARCHAR(50);

-- Create reservation table if it doesn't exist
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(15) NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    room VARCHAR(50) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(idno) ON DELETE CASCADE
); 

-- Add computer_id field to sit_in_sessions if it doesn't exist
ALTER TABLE sit_in_sessions ADD COLUMN IF NOT EXISTS computer_id INT NULL;

-- Add computer field to reservations if it doesn't exist
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS computer INT NULL;

-- Create sit_in_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS sit_in_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    session_id INT,
    purpose VARCHAR(50),
    laboratory VARCHAR(20),
    computer_id INT NULL,
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_end DATETIME NULL,
    duration INT NULL,
    status ENUM('active', 'completed') DEFAULT 'active'
); 

-- Create lab_schedules table if it doesn't exist
CREATE TABLE IF NOT EXISTS lab_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room VARCHAR(20) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    instructor VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
); 