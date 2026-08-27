-- CreateTable
CREATE TABLE "call_sheets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "shootDayId" TEXT NOT NULL,
    "title" TEXT,
    "generalCrewCall" TEXT,
    "breakfastTime" TEXT,
    "firstShotTime" TEXT,
    "lunchTime" TEXT,
    "estimatedWrap" TEXT,
    "weatherNotes" TEXT,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "parkingNotes" TEXT,
    "basecampNotes" TEXT,
    "nearestHospital" TEXT,
    "generalNotes" TEXT,
    "departmentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cast_calls" (
    "id" TEXT NOT NULL,
    "callSheetId" TEXT NOT NULL,
    "castNumber" TEXT,
    "characterName" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "status" TEXT,
    "pickupTime" TEXT,
    "hmuCall" TEXT,
    "onSetCall" TEXT,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cast_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "call_sheets_shootDayId_key" ON "call_sheets"("shootDayId");

-- CreateIndex
CREATE INDEX "call_sheets_projectId_idx" ON "call_sheets"("projectId");

-- CreateIndex
CREATE INDEX "cast_calls_callSheetId_idx" ON "cast_calls"("callSheetId");

-- AddForeignKey
ALTER TABLE "call_sheets" ADD CONSTRAINT "call_sheets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sheets" ADD CONSTRAINT "call_sheets_shootDayId_fkey" FOREIGN KEY ("shootDayId") REFERENCES "shoot_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cast_calls" ADD CONSTRAINT "cast_calls_callSheetId_fkey" FOREIGN KEY ("callSheetId") REFERENCES "call_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
