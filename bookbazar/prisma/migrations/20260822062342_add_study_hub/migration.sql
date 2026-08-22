-- Study Hub: school & university academic hierarchy + study materials

CREATE TYPE "StudyMaterialType" AS ENUM ('NOTES', 'QUESTION_PAPER');
CREATE TYPE "StudyFileType" AS ENUM ('PDF', 'IMAGE');
CREATE TYPE "AccessType" AS ENUM ('FREE', 'PAID');
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE "school_classes" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "hasStreams" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "school_classes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "school_classes_level_key" ON "school_classes"("level");

CREATE TABLE "streams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "streams_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "streams_name_key" ON "streams"("name");
CREATE UNIQUE INDEX "streams_slug_key" ON "streams"("slug");

CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subjects_slug_key" ON "subjects"("slug");

CREATE TABLE "class_subjects" (
    "id" TEXT NOT NULL,
    "schoolClassId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "streamId" TEXT,
    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "class_subjects_schoolClassId_idx" ON "class_subjects"("schoolClassId");
CREATE UNIQUE INDEX "class_subjects_schoolClassId_subjectId_streamId_key" ON "class_subjects"("schoolClassId", "subjectId", "streamId");
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "school_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "universities_name_key" ON "universities"("name");
CREATE UNIQUE INDEX "universities_slug_key" ON "universities"("slug");

CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "totalSemesters" INTEGER NOT NULL DEFAULT 8,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "programs_universityId_idx" ON "programs"("universityId");
CREATE UNIQUE INDEX "programs_universityId_slug_key" ON "programs"("universityId", "slug");
ALTER TABLE "programs" ADD CONSTRAINT "programs_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "semesters_programId_number_key" ON "semesters"("programId", "number");
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "program_subjects" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "program_subjects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "program_subjects_semesterId_idx" ON "program_subjects"("semesterId");
CREATE UNIQUE INDEX "program_subjects_semesterId_subjectId_key" ON "program_subjects"("semesterId", "subjectId");
ALTER TABLE "program_subjects" ADD CONSTRAINT "program_subjects_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_subjects" ADD CONSTRAINT "program_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "study_materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "StudyMaterialType" NOT NULL DEFAULT 'NOTES',
    "fileUrl" TEXT NOT NULL,
    "fileType" "StudyFileType" NOT NULL DEFAULT 'PDF',
    "thumbnailUrl" TEXT,
    "accessType" "AccessType" NOT NULL DEFAULT 'FREE',
    "price" DECIMAL(10,2),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classSubjectId" TEXT,
    "programSubjectId" TEXT,
    "uploadedById" TEXT NOT NULL,
    CONSTRAINT "study_materials_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "study_materials_slug_key" ON "study_materials"("slug");
CREATE INDEX "study_materials_classSubjectId_idx" ON "study_materials"("classSubjectId");
CREATE INDEX "study_materials_programSubjectId_idx" ON "study_materials"("programSubjectId");
CREATE INDEX "study_materials_isPublished_accessType_idx" ON "study_materials"("isPublished", "accessType");
CREATE INDEX "study_materials_createdAt_idx" ON "study_materials"("createdAt");
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "class_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_programSubjectId_fkey" FOREIGN KEY ("programSubjectId") REFERENCES "program_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "study_material_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studyMaterialId" TEXT NOT NULL,
    "pricePaid" DECIMAL(10,2) NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "study_material_purchases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "study_material_purchases_userId_studyMaterialId_key" ON "study_material_purchases"("userId", "studyMaterialId");
ALTER TABLE "study_material_purchases" ADD CONSTRAINT "study_material_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_material_purchases" ADD CONSTRAINT "study_material_purchases_studyMaterialId_fkey" FOREIGN KEY ("studyMaterialId") REFERENCES "study_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
