-- Replace the Program-level Helper system with a subject-level Contributor
-- system, and add Chapters + the BookMandu Credits ledger.

-- Drop the old Helper tables (superseded by contributor_requests /
-- contributor_permissions below — same idea, subject-level grants).
DROP TABLE IF EXISTS "helper_requests";
DROP TABLE IF EXISTS "program_helpers";
DROP TYPE IF EXISTS "HelperRequestStatus";

-- New enums
CREATE TYPE "ContributorRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "StudyMaterialStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'UNPUBLISHED');
CREATE TYPE "ChapterSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "CreditTransactionType" AS ENUM ('CONTRIBUTION_REWARD', 'BOOK_REDEMPTION', 'REFUND', 'ADMIN_ADJUSTMENT');

-- users: credit balance cache
ALTER TABLE "users" ADD COLUMN "creditBalance" INTEGER NOT NULL DEFAULT 0;

-- orders: rupee value absorbed by credits
ALTER TABLE "orders" ADD COLUMN "creditsApplied" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- contributor_requests
CREATE TABLE "contributor_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolClassId" TEXT,
    "programId" TEXT,
    "message" TEXT,
    "status" "ContributorRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "contributor_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contributor_requests_userId_idx" ON "contributor_requests"("userId");
CREATE INDEX "contributor_requests_schoolClassId_idx" ON "contributor_requests"("schoolClassId");
CREATE INDEX "contributor_requests_programId_idx" ON "contributor_requests"("programId");
CREATE INDEX "contributor_requests_status_idx" ON "contributor_requests"("status");
ALTER TABLE "contributor_requests" ADD CONSTRAINT "contributor_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contributor_requests" ADD CONSTRAINT "contributor_requests_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contributor_requests" ADD CONSTRAINT "contributor_requests_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contributor_requests" ADD CONSTRAINT "contributor_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- contributor_permissions
CREATE TABLE "contributor_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classSubjectId" TEXT,
    "programSubjectId" TEXT,
    "grantedById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contributor_permissions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contributor_permissions_userId_idx" ON "contributor_permissions"("userId");
CREATE INDEX "contributor_permissions_classSubjectId_idx" ON "contributor_permissions"("classSubjectId");
CREATE INDEX "contributor_permissions_programSubjectId_idx" ON "contributor_permissions"("programSubjectId");
ALTER TABLE "contributor_permissions" ADD CONSTRAINT "contributor_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contributor_permissions" ADD CONSTRAINT "contributor_permissions_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "class_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contributor_permissions" ADD CONSTRAINT "contributor_permissions_programSubjectId_fkey" FOREIGN KEY ("programSubjectId") REFERENCES "program_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "contributor_permissions" ADD CONSTRAINT "contributor_permissions_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- chapters
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "chapters_subjectId_idx" ON "chapters"("subjectId");
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- chapter_suggestions
CREATE TABLE "chapter_suggestions" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "suggestedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "status" "ChapterSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "chapterId" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "chapter_suggestions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "chapter_suggestions_subjectId_idx" ON "chapter_suggestions"("subjectId");
CREATE INDEX "chapter_suggestions_status_idx" ON "chapter_suggestions"("status");
ALTER TABLE "chapter_suggestions" ADD CONSTRAINT "chapter_suggestions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chapter_suggestions" ADD CONSTRAINT "chapter_suggestions_suggestedById_fkey" FOREIGN KEY ("suggestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chapter_suggestions" ADD CONSTRAINT "chapter_suggestions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chapter_suggestions" ADD CONSTRAINT "chapter_suggestions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- study_materials: isPublished -> status, plus new fields
ALTER TABLE "study_materials" ADD COLUMN "status" "StudyMaterialStatus" NOT NULL DEFAULT 'PENDING';
UPDATE "study_materials" SET "status" = CASE WHEN "isPublished" THEN 'APPROVED' ELSE 'PENDING' END::"StudyMaterialStatus";
ALTER TABLE "study_materials" DROP COLUMN "isPublished";
ALTER TABLE "study_materials" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "study_materials" ADD COLUMN "fileHash" TEXT;
ALTER TABLE "study_materials" ADD COLUMN "ownershipConfirmedAt" TIMESTAMP(3);
ALTER TABLE "study_materials" ADD COLUMN "chapterId" TEXT;
DROP INDEX IF EXISTS "study_materials_isPublished_accessType_idx";
CREATE INDEX "study_materials_status_accessType_idx" ON "study_materials"("status", "accessType");
CREATE INDEX "study_materials_fileHash_idx" ON "study_materials"("fileHash");
CREATE INDEX "study_materials_chapterId_idx" ON "study_materials"("chapterId");
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- study_material_reports
CREATE TABLE "study_material_reports" (
    "id" TEXT NOT NULL,
    "studyMaterialId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    CONSTRAINT "study_material_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "study_material_reports_studyMaterialId_idx" ON "study_material_reports"("studyMaterialId");
CREATE INDEX "study_material_reports_status_idx" ON "study_material_reports"("status");
ALTER TABLE "study_material_reports" ADD CONSTRAINT "study_material_reports_studyMaterialId_fkey" FOREIGN KEY ("studyMaterialId") REFERENCES "study_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_material_reports" ADD CONSTRAINT "study_material_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_material_reports" ADD CONSTRAINT "study_material_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- credit_transactions (the ledger)
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "credit_transactions_userId_createdAt_idx" ON "credit_transactions"("userId", "createdAt");
CREATE INDEX "credit_transactions_referenceType_referenceId_idx" ON "credit_transactions"("referenceType", "referenceId");
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- credit_settings (single-row config)
CREATE TABLE "credit_settings" (
    "id" TEXT NOT NULL,
    "creditValueInRupees" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    "contributionReward" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "credit_settings_pkey" PRIMARY KEY ("id")
);
