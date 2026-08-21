# CCS Sit-In Monitoring System
A PHP/MySQL web app for the College of Computer Studies (CCS) computer laboratory sit-in workflow. Students can register, reserve lab time, track remaining sessions, and view announcements; admins manage sit-ins, lab computers, schedules, resources, points, and reports from a single dashboard.
## Features
### Students
- Register and log in with ID number
- View remaining sit-in sessions and behavior points
- Request lab reservations (date, time slot, purpose, language)
- Track sit-in history and personal statistics
- Receive notifications (reservations, sit-ins, system alerts)
- Submit feedback
- View announcements and attendance leaderboard
- Update profile details
### Admins (`idno` = `00`)
- Activate and end sit-in sessions
- Approve or reject reservation requests
- Manage students (add, edit, delete, reset sessions)
- Control lab computer lock/unlock status
- Manage lab schedules and resources
- Post and remove announcements
- Award points / extra sessions
- View programming-language usage stats and admin logs
### Labs
Supported laboratories: **524**, **526**, **528**, **530**, **547**, and **MAC**.
## Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | PHP 8+ |
| Database | MySQL / MariaDB |
| Frontend | HTML, CSS, JavaScript |
| Server | Apache (XAMPP / WAMP recommended) |
## Requirements
- PHP 8.0 or later
- MySQL 5.7+ or MariaDB 10.4+
- Apache with `mod_rewrite` (optional)
- Browser with JavaScript enabled (desktop-focused)
## Setup
### 1. Clone or copy the project
Place the project folder in your web root, for example:
```text
C:\xampp\htdocs\sysarch
```
### 2. Create the database
1. Start Apache and MySQL (e.g. via XAMPP).
2. Open phpMyAdmin (`http://localhost/phpmyadmin`).
3. Create a database named `sysarch`.
4. Import `sysarch.sql` into that database.
Alternatively, after logging in as admin you can run `create_tables.php` to create core tables and sample users.
### 3. Configure the database connection
Edit `database.php` if your MySQL credentials differ from the defaults:
```php
$servername = "localhost";
$username = "root";
$password = "";
$database = "sysarch";
```
### 4. Run the app
Open:
```text
http://localhost/sysarch/
```
Login is at `index.php`. New students can register at `register.php`.
## Default accounts
Created by `create_tables.php` when the `users` table is empty:
| Role | ID Number | Password |
|------|-----------|----------|
| Admin | `00` | `admin123` |
| Sample student | `2023-0001` | `student123` |
Change these passwords after first login. Admin password can also be updated via `change_admin_password.php`.
## Project structure
```text
sysarch/
├── index.php                 # Login
├── register.php              # Student registration
├── homepage.php              # Main dashboard (admin & student)
├── database.php              # DB connection
├── sysarch.sql               # Full database dump
├── create_tables.php         # Schema bootstrap (admin only)
├── logout.php
├── css/                      # Stylesheets
├── js/                       # Client scripts (labs, computers, schedules)
├── images/                   # Uploaded / static images
├── uploads/                  # User uploads
├── includes/                 # Shared PHP includes
│
├── activate_sit_in.php       # Start a sit-in
├── end_sit_in.php            # End a sit-in (with reward flow)
├── approve_reservation.php
├── reject_reservation.php
├── submit_reservation.php
├── make_reservation.php
│
├── get_computers.php         # Lab computer APIs
├── toggle_computer.php
├── computer_control_module.php
│
├── save_schedule.php         # Lab schedule APIs
├── get_schedule.php
├── delete_schedule.php
│
├── notifications.php
├── student_notifications.php
├── leaderboard.php
├── student_sit_in_statistics.php
└── student_sections.php
```
## Key database tables
| Table | Purpose |
|-------|---------|
| `users` | Students and admin accounts |
| `sit_in_sessions` | Active and completed sit-ins |
| `reservations` | Pending / approved / rejected bookings |
| `computer_status` / `lab_computers` | Per-lab PC lock state |
| `lab_schedules` | Lab availability schedule |
| `announcements` | Posted notices |
| `notifications` | Student alerts |
| `points_log` | Behavior points and session grants |
| `attendance_leaderboard` | Sit-in attendance ranking |
| `feedback` / `student_feedback` | Student feedback |
| `admin_logs` | Admin action audit trail |
## Usage notes
- Admin access is determined by session flag when `idno == '00'`.
- Students start with a default remaining session count (typically 10).
- Completing sit-ins can update attendance leaderboard and points.
- The UI is primarily intended for desktop use.
## Optional modules
See `install_notifications_module.md` for enabling or verifying the student notifications bell, dropdown, and related API endpoints.
## License
Academic / course project — use and modify as needed for your institution.
