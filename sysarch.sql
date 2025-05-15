-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 05, 2025 at 05:18 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sysarch`
--

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `date_posted` datetime DEFAULT current_timestamp(),
  `posted_by` varchar(50) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `title`, `content`, `date_posted`, `posted_by`, `status`) VALUES
(1, '1ST ANNOUNCEMENT', 'Hello World\r\n', '2025-03-06 11:06:59', '00', 'active'),
(2, 'New Tickets in for TYLER, THE CREATOR Concert', 'BUY NOW\r\n', '2025-03-07 00:59:01', '00', 'inactive'),
(3, 'hssh', 'shshs', '2025-03-26 22:04:21', '00', 'inactive'),
(4, 'hello welrd', 'so werd hgasfas\r\n', '2025-04-05 20:53:30', '00', 'active'),
(5, 'ROLLY', 'KAPOY\r\n', '2025-05-03 03:07:59', '00', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_leaderboard`
--

CREATE TABLE `attendance_leaderboard` (
  `id` int(11) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `attendance_count` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance_leaderboard`
--

INSERT INTO `attendance_leaderboard` (`id`, `student_id`, `attendance_count`, `last_updated`) VALUES
(1, '1', 3, '2025-05-02 21:24:40');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `room` varchar(10) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `feedback_text` text DEFAULT NULL,
  `status` enum('read','unread') DEFAULT 'unread',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lab_resources`
--

CREATE TABLE `lab_resources` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `link` varchar(512) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lab_resources`
--

INSERT INTO `lab_resources` (`id`, `title`, `link`, `description`, `status`, `created_at`) VALUES
(1, 'ana na may l', 'https://drive.google.com/file/d/1JNZQCKcuaygr74XifordtpYHg2oaNbAY/view', 'hahaha', 'active', '2025-04-20 12:40:03'),
(2, 'BOANG', 'http://localhost/phpmyadmin/index.php?route=/database/export&db=sysarch', 'HHAHA\r\n', 'inactive', '2025-04-23 12:38:53'),
(3, 'wahas', 'uploads/resources/6815019dee4fe.mp4', 'has', 'active', '2025-05-02 17:32:13');

-- --------------------------------------------------------

--
-- Table structure for table `lab_schedules`
--

CREATE TABLE `lab_schedules` (
  `id` int(11) NOT NULL,
  `room` varchar(20) NOT NULL,
  `day_of_week` varchar(20) NOT NULL,
  `time_slot` varchar(50) NOT NULL,
  `course_code` varchar(50) NOT NULL,
  `instructor` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lab_schedules`
--

INSERT INTO `lab_schedules` (`id`, `room`, `day_of_week`, `time_slot`, `course_code`, `instructor`, `created_at`, `updated_at`) VALUES
(1, '524', 'Monday', '7:00:00 - 9:00:00', 'iyotsex', 'rolly alonso', '2025-05-05 11:32:41', '2025-05-05 11:32:41');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `student_id` varchar(15) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_status` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `points_log`
--

CREATE TABLE `points_log` (
  `id` int(11) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `points_added` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `sessions_added` int(11) DEFAULT NULL,
  `added_by` varchar(20) DEFAULT NULL,
  `added_on` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `points_log`
--

INSERT INTO `points_log` (`id`, `student_id`, `points_added`, `reason`, `sessions_added`, `added_by`, `added_on`) VALUES
(1, '1', 1, 'Completed sit-in session successfully', 0, '00', '2025-05-03 01:12:53'),
(2, '1', 1, 'Completed sit-in session successfully', 0, '00', '2025-05-03 03:36:48');

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `student_id` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time_slot` varchar(20) DEFAULT NULL,
  `purpose` text DEFAULT NULL,
  `programming_language` varchar(50) DEFAULT NULL,
  `room` varchar(10) DEFAULT NULL,
  `computer` varchar(50) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`id`, `student_id`, `date`, `time_slot`, `purpose`, `programming_language`, `room`, `computer`, `status`, `created_at`, `updated_at`) VALUES
(1, '999', '2025-04-10', '16:00-17:30', 'walang', 'PHP', NULL, NULL, 'approved', '2025-04-04 02:34:16', NULL),
(2, '999', '2025-04-18', '16:00-17:30', 'ahah', 'PHP', NULL, NULL, 'approved', '2025-04-04 05:59:59', NULL),
(3, '999', '2025-04-24', '11:00-12:30', 'ashas', 'PHP', NULL, NULL, 'approved', '2025-04-22 14:14:14', '2025-05-02 17:11:55'),
(4, '999', '2025-05-15', '09:30-11:00', 'PHP', NULL, '526', NULL, 'pending', '2025-05-01 19:38:23', NULL),
(5, '999', '2025-05-12', '13:00-14:30', 'PHP', NULL, '524', NULL, 'approved', '2025-05-02 17:01:31', '2025-05-02 19:36:16'),
(6, '999', '2025-05-15', '09:30-11:00', 'ASP.Net', NULL, '524', NULL, 'pending', '2025-05-02 17:34:32', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `resources`
--

CREATE TABLE `resources` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sit_in_records`
--

CREATE TABLE `sit_in_records` (
  `id` int(11) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `date_in` datetime DEFAULT current_timestamp(),
  `date_out` datetime DEFAULT NULL,
  `language_used` enum('C#','C','Java','ASP.Net','PHP') NOT NULL,
  `status` enum('active','completed') DEFAULT 'active',
  `room` varchar(50) DEFAULT 'Lab 1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sit_in_sessions`
--

CREATE TABLE `sit_in_sessions` (
  `id` int(11) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `laboratory` varchar(10) DEFAULT NULL,
  `session_start` datetime DEFAULT current_timestamp(),
  `session_end` datetime DEFAULT NULL,
  `status` enum('active','completed','cancelled') DEFAULT 'active',
  `duration` int(11) DEFAULT NULL,
  `computer_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sit_in_sessions`
--

INSERT INTO `sit_in_sessions` (`id`, `student_id`, `purpose`, `laboratory`, `session_start`, `session_end`, `status`, `duration`, `computer_id`) VALUES
(1, '1', 'C', '526', '2025-04-23 17:46:03', '2025-05-02 19:12:53', 'completed', 13047, NULL),
(2, '1', 'ASP.Net', '524', '2025-05-03 03:36:34', '2025-05-02 21:36:48', 'completed', -360, 1),
(3, '1', 'ASP.Net', '528', '2025-05-03 05:24:40', NULL, 'active', NULL, 23);

-- --------------------------------------------------------

--
-- Table structure for table `student_feedback`
--

CREATE TABLE `student_feedback` (
  `id` int(11) NOT NULL,
  `student_id` varchar(50) NOT NULL,
  `room` varchar(50) NOT NULL,
  `rating` int(1) NOT NULL,
  `feedback_type` varchar(50) NOT NULL,
  `comments` text NOT NULL,
  `suggestions` text DEFAULT NULL,
  `status` enum('unread','read') DEFAULT 'unread',
  `date_submitted` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_feedback`
--

INSERT INTO `student_feedback` (`id`, `student_id`, `room`, `rating`, `feedback_type`, `comments`, `suggestions`, `status`, `date_submitted`) VALUES
(1, '999', '524', 5, 'Staff', 'hahash', 'ashashasas', 'read', '2025-04-23 11:42:37'),
(2, '999', '526', 5, 'Equipment', 'r', 'f', 'read', '2025-05-01 19:35:06');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `idno` varchar(20) NOT NULL,
  `lastname` varchar(50) NOT NULL,
  `firstname` varchar(50) NOT NULL,
  `midname` varchar(50) DEFAULT NULL,
  `course` varchar(50) NOT NULL,
  `yearlvl` tinyint(1) NOT NULL,
  `email` varchar(100) NOT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','admin') NOT NULL DEFAULT 'student',
  `status` enum('active','inactive') DEFAULT 'active',
  `remaining_sessions` int(11) DEFAULT 10,
  `behavior_points` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `idno`, `lastname`, `firstname`, `midname`, `course`, `yearlvl`, `email`, `photo`, `password`, `role`, `status`, `remaining_sessions`, `behavior_points`) VALUES
(1, '1', 'Cutad', 'Arnold', 'Alamo', '1', 4, 'cutadalamo@gmail.com', NULL, '$2y$10$lbPgxaQZkm936QMod2mA3.oUrpnUu7SyM72IHYpXS27.M/qX/kyQ6', 'student', 'active', 6, 2),
(4, '999', 'West', 'Kanye', 'Omari', '2', 4, 'iamtheGOD@yahoo.com', '67c90e0a68c65.jpg', '$2y$10$dInB.FQo/sz9.IEO9xR48uAv706MfzgSEZNyEcoQeQv38giQXfnm2', 'student', 'active', 10, 0),
(7, '00', 'Admin', 'Admin', '', '1', 1, 'admin@example.com', '67c90e2e97c8f.jpg', '$2y$10$dY93JakZvUrDSKZu5hqANeJ6wrCzuGpN05pziFDgBG.AksfpTBIjm', 'student', 'active', 10, 0),
(8, '143', 'Gulfan', 'Charlene', 'June', '2', 4, 'cjg@gmail.com', '67caa5f1b6705.jpg', '$2y$10$6Azhb6xQgxBmPh44fO5fM.wo6ciGRDnMbKL.kwWtTFiDa1dqH8b9O', 'student', 'active', 10, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `attendance_leaderboard`
--
ALTER TABLE `attendance_leaderboard`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lab_resources`
--
ALTER TABLE `lab_resources`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lab_schedules`
--
ALTER TABLE `lab_schedules`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `points_log`
--
ALTER TABLE `points_log`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `resources`
--
ALTER TABLE `resources`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sit_in_records`
--
ALTER TABLE `sit_in_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `sit_in_sessions`
--
ALTER TABLE `sit_in_sessions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `student_feedback`
--
ALTER TABLE `student_feedback`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idno` (`idno`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `attendance_leaderboard`
--
ALTER TABLE `attendance_leaderboard`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lab_resources`
--
ALTER TABLE `lab_resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `lab_schedules`
--
ALTER TABLE `lab_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `points_log`
--
ALTER TABLE `points_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `resources`
--
ALTER TABLE `resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sit_in_records`
--
ALTER TABLE `sit_in_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sit_in_sessions`
--
ALTER TABLE `sit_in_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student_feedback`
--
ALTER TABLE `student_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`idno`) ON DELETE CASCADE;

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`idno`);

--
-- Constraints for table `sit_in_records`
--
ALTER TABLE `sit_in_records`
  ADD CONSTRAINT `sit_in_records_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`idno`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
