CREATE TYPE "HelperRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "helper_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "message" TEXT,
    "status" "HelperRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "helper_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "helper_requests_userId_programId_key" ON "helper_requests"("userId", "programId");
ALTER TABLE "helper_requests" ADD CONSTRAINT "helper_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "helper_requests" ADD CONSTRAINT "helper_requests_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "helper_requests" ADD CONSTRAINT "helper_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "program_helpers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "program_helpers_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "program_helpers_userId_programId_key" ON "program_helpers"("userId", "programId");
ALTER TABLE "program_helpers" ADD CONSTRAINT "program_helpers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_helpers" ADD CONSTRAINT "program_helpers_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
