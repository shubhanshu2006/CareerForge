-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "Source" AS ENUM ('ADZUNA', 'SKILLCAREERHUB', 'LINKEDIN', 'INDEED', 'COMPANY_WEBSITE', 'GLASSDOOR', 'GREENHOUSE', 'LEVER', 'ASHBY', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY', 'FREELANCE');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SAVED', 'APPLIED', 'OA', 'INTERVIEW', 'FINAL_ROUND', 'OFFER', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('GITHUB', 'LINKEDIN', 'PORTFOLIO', 'X', 'MEDIUM', 'DEVTO', 'YOUTUBE', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('JOB_ALERT', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "password" TEXT,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "role" "Role" NOT NULL DEFAULT 'USER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "accountEnabled" BOOLEAN NOT NULL DEFAULT true,
    "accountLocked" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_social_links" (
    "userId" INTEGER NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "user_social_links_pkey" PRIMARY KEY ("userId","platform")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" INTEGER NOT NULL,
    "name" TEXT,
    "profilePictureUrl" TEXT,
    "yearsOfExperience" INTEGER,
    "currentLocation" TEXT,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_work_types" (
    "userId" INTEGER NOT NULL,
    "workType" "WorkType" NOT NULL,

    CONSTRAINT "user_work_types_pkey" PRIMARY KEY ("userId","workType")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "userId" INTEGER NOT NULL,
    "skill" TEXT NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("userId","skill")
);

-- CreateTable
CREATE TABLE "user_locations" (
    "userId" INTEGER NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("userId","location")
);

-- CreateTable
CREATE TABLE "user_job_preferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_job_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_job_preference_titles" (
    "preferenceId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "user_job_preference_titles_pkey" PRIMARY KEY ("preferenceId","title")
);

-- CreateTable
CREATE TABLE "user_job_preference_skills" (
    "preferenceId" INTEGER NOT NULL,
    "skill" TEXT NOT NULL,

    CONSTRAINT "user_job_preference_skills_pkey" PRIMARY KEY ("preferenceId","skill")
);

-- CreateTable
CREATE TABLE "user_job_preference_role_types" (
    "preferenceId" INTEGER NOT NULL,
    "roleType" TEXT NOT NULL,

    CONSTRAINT "user_job_preference_role_types_pkey" PRIMARY KEY ("preferenceId","roleType")
);

-- CreateTable
CREATE TABLE "user_preferred_companies" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferred_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerUserId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "linkedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT,
    "dedupe_key" TEXT,
    "source" "Source" NOT NULL,
    "company" TEXT NOT NULL,
    "companyLogo" TEXT,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "department" TEXT,
    "employmentType" "EmploymentType",
    "description" TEXT,
    "applyUrl" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "experienceLevel" "ExperienceLevel",
    "minSalary" INTEGER NOT NULL DEFAULT 0,
    "maxSalary" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SAVED',
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_notes" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "round" TEXT,
    "notes" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_alerts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "user_job_preferences_userId_key" ON "user_job_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_externalId_key" ON "jobs"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_dedupe_key_key" ON "jobs"("dedupe_key");

-- CreateIndex
CREATE INDEX "jobs_title_idx" ON "jobs"("title");

-- CreateIndex
CREATE INDEX "jobs_company_idx" ON "jobs"("company");

-- CreateIndex
CREATE INDEX "jobs_location_idx" ON "jobs"("location");

-- CreateIndex
CREATE INDEX "jobs_postedAt_idx" ON "jobs"("postedAt");

-- CreateIndex
CREATE INDEX "jobs_isRemote_idx" ON "jobs"("isRemote");

-- CreateIndex
CREATE UNIQUE INDEX "applications_userId_jobId_key" ON "applications"("userId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "job_alerts_userId_jobId_key" ON "job_alerts"("userId", "jobId");

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_social_links" ADD CONSTRAINT "user_social_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_work_types" ADD CONSTRAINT "user_work_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_job_preferences" ADD CONSTRAINT "user_job_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_job_preference_titles" ADD CONSTRAINT "user_job_preference_titles_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "user_job_preferences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_job_preference_skills" ADD CONSTRAINT "user_job_preference_skills_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "user_job_preferences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_job_preference_role_types" ADD CONSTRAINT "user_job_preference_role_types_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "user_job_preferences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferred_companies" ADD CONSTRAINT "user_preferred_companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_alerts" ADD CONSTRAINT "job_alerts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
