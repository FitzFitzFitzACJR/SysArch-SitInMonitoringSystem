-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'LAB_STAFF', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ComputerState" AS ENUM ('ACTIVE', 'LOCKED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SitInStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SitInEndReason" AS ENUM ('STAFF', 'TIME_LIMIT', 'LAB_CLOSING');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'NO_SHOW', 'FULFILLED');

-- CreateEnum
CREATE TYPE "LedgerReason" AS ENUM ('SIT_IN_START', 'SIT_IN_REFUND', 'SIT_IN_REWARD', 'MANUAL_POINTS', 'MANUAL_SESSIONS', 'POINTS_CONVERSION', 'NO_SHOW_PENALTY', 'SEMESTER_RESET', 'LEGACY_IMPORT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RESERVATION', 'SIT_IN', 'POINTS', 'ANNOUNCEMENT', 'ISSUE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('EQUIPMENT', 'FACILITIES', 'STAFF', 'SERVICES', 'OTHER');

-- CreateEnum
CREATE TYPE "IssueCategory" AS ENUM ('NO_INTERNET', 'PERIPHERAL', 'DISPLAY', 'SOFTWARE', 'HARDWARE', 'OTHER');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'LAB', 'COURSE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "courseId" TEXT,
    "yearLevel" INTEGER,
    "photoUrl" TEXT,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "qrToken" TEXT NOT NULL,
    "remainingSessions" INTEGER NOT NULL DEFAULT 0,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "rulesAcceptedVer" INTEGER,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "sessionAllotment" INTEGER NOT NULL,
    "resetAppliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gridColumns" INTEGER NOT NULL DEFAULT 10,
    "opensAt" INTEGER,
    "closesAt" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Computer" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "state" "ComputerState" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Computer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitIn" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "computerId" TEXT,
    "languageId" TEXT NOT NULL,
    "purpose" TEXT,
    "semesterId" TEXT NOT NULL,
    "reservationId" TEXT,
    "status" "SitInStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "warnedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "endReason" "SitInEndReason",
    "rewarded" BOOLEAN NOT NULL DEFAULT false,
    "startedById" TEXT NOT NULL,
    "endedById" TEXT,

    CONSTRAINT "SitIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "computerId" TEXT,
    "timeSlotId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "languageId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabSchedule" (
    "id" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "courseCode" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,

    CONSTRAINT "LabSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "publishAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "labId" TEXT,
    "courseId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "sitInId" TEXT,
    "rating" INTEGER NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "comments" TEXT NOT NULL,
    "suggestions" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComputerIssue" (
    "id" TEXT NOT NULL,
    "computerId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "sitInId" TEXT,
    "category" "IssueCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComputerIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointsDelta" INTEGER NOT NULL DEFAULT 0,
    "sessionsDelta" INTEGER NOT NULL DEFAULT 0,
    "reason" "LedgerReason" NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "sitInId" TEXT,
    "semesterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "defaultSessions" INTEGER NOT NULL DEFAULT 10,
    "sitInRewardPoints" INTEGER NOT NULL DEFAULT 1,
    "pointsPerSession" INTEGER NOT NULL DEFAULT 3,
    "maxSitInMinutes" INTEGER NOT NULL DEFAULT 180,
    "warnBeforeMinutes" INTEGER NOT NULL DEFAULT 10,
    "labOpensAt" INTEGER NOT NULL DEFAULT 420,
    "labClosesAt" INTEGER NOT NULL DEFAULT 1080,
    "requireReservationApproval" BOOLEAN NOT NULL DEFAULT true,
    "reservationMaxDaysAhead" INTEGER NOT NULL DEFAULT 14,
    "reminderMinutesBefore" INTEGER NOT NULL DEFAULT 60,
    "noShowGraceMinutes" INTEGER NOT NULL DEFAULT 15,
    "noShowPenaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "noShowBlockThreshold" INTEGER,
    "maxLoginAttempts" INTEGER NOT NULL DEFAULT 5,
    "lockoutMinutes" INTEGER NOT NULL DEFAULT 15,
    "sessionMaxAgeHours" INTEGER NOT NULL DEFAULT 8,
    "rulesText" TEXT NOT NULL DEFAULT '',
    "rulesVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_idNumber_key" ON "User"("idNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_qrToken_key" ON "User"("qrToken");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_lastName_firstName_idx" ON "User"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_name_key" ON "Semester"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Lab_code_key" ON "Lab"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Computer_labId_number_key" ON "Computer"("labId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_startMinute_endMinute_key" ON "TimeSlot"("startMinute", "endMinute");

-- CreateIndex
CREATE UNIQUE INDEX "SitIn_reservationId_key" ON "SitIn"("reservationId");

-- CreateIndex
CREATE INDEX "SitIn_studentId_status_idx" ON "SitIn"("studentId", "status");

-- CreateIndex
CREATE INDEX "SitIn_labId_status_idx" ON "SitIn"("labId", "status");

-- CreateIndex
CREATE INDEX "SitIn_status_endsAt_idx" ON "SitIn"("status", "endsAt");

-- CreateIndex
CREATE INDEX "SitIn_startedAt_idx" ON "SitIn"("startedAt");

-- CreateIndex
CREATE INDEX "Reservation_labId_date_timeSlotId_status_idx" ON "Reservation"("labId", "date", "timeSlotId", "status");

-- CreateIndex
CREATE INDEX "Reservation_studentId_status_idx" ON "Reservation"("studentId", "status");

-- CreateIndex
CREATE INDEX "LabSchedule_labId_dayOfWeek_idx" ON "LabSchedule"("labId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Announcement_archivedAt_publishAt_idx" ON "Announcement"("archivedAt", "publishAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_readAt_createdAt_idx" ON "Feedback"("readAt", "createdAt");

-- CreateIndex
CREATE INDEX "ComputerIssue_status_createdAt_idx" ON "ComputerIssue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PointsLog_userId_createdAt_idx" ON "PointsLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_createdAt_idx" ON "LoginAttempt"("ip", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Computer" ADD CONSTRAINT "Computer_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitIn" ADD CONSTRAINT "SitIn_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitIn" ADD CONSTRAINT "SitIn_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitIn" ADD CONSTRAINT "SitIn_endedById_fkey" FOREIGN KEY ("endedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitIn" ADD CONSTRAINT "SitIn_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitIn" ADD CONSTRAINT "SitIn_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitIn" ADD CONSTRAINT "SitIn_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitIn" ADD CONSTRAINT "SitIn_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitIn" ADD CONSTRAINT "SitIn_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSchedule" ADD CONSTRAINT "LabSchedule_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSchedule" ADD CONSTRAINT "LabSchedule_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_sitInId_fkey" FOREIGN KEY ("sitInId") REFERENCES "SitIn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputerIssue" ADD CONSTRAINT "ComputerIssue_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputerIssue" ADD CONSTRAINT "ComputerIssue_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputerIssue" ADD CONSTRAINT "ComputerIssue_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputerIssue" ADD CONSTRAINT "ComputerIssue_sitInId_fkey" FOREIGN KEY ("sitInId") REFERENCES "SitIn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLog" ADD CONSTRAINT "PointsLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLog" ADD CONSTRAINT "PointsLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLog" ADD CONSTRAINT "PointsLog_sitInId_fkey" FOREIGN KEY ("sitInId") REFERENCES "SitIn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsLog" ADD CONSTRAINT "PointsLog_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Business rules Prisma's schema language can't express. The service layer checks
-- these too (for friendly errors); the database is the last line of defence against races.
-- ---------------------------------------------------------------------------

-- A student can have at most one active sit-in.
CREATE UNIQUE INDEX "SitIn_one_active_per_student" ON "SitIn"("studentId") WHERE "status" = 'ACTIVE';

-- A computer can be used by at most one active sit-in.
CREATE UNIQUE INDEX "SitIn_one_active_per_computer" ON "SitIn"("computerId") WHERE "status" = 'ACTIVE' AND "computerId" IS NOT NULL;

-- A computer can't be double-booked, and a student can't hold two live bookings in one slot.
CREATE UNIQUE INDEX "Reservation_live_per_computer_slot" ON "Reservation"("computerId", "date", "timeSlotId")
  WHERE "status" IN ('PENDING', 'APPROVED') AND "computerId" IS NOT NULL;
CREATE UNIQUE INDEX "Reservation_live_per_student_slot" ON "Reservation"("studentId", "date", "timeSlotId")
  WHERE "status" IN ('PENDING', 'APPROVED');

ALTER TABLE "User" ADD CONSTRAINT "User_yearLevel_range" CHECK ("yearLevel" IS NULL OR "yearLevel" BETWEEN 1 AND 4);
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_valid_range" CHECK ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");
ALTER TABLE "LabSchedule" ADD CONSTRAINT "LabSchedule_valid_range" CHECK ("dayOfWeek" BETWEEN 0 AND 6 AND "startMinute" < "endMinute");
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_singleton" CHECK ("id" = 1);
