CREATE TABLE "shoot_days" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "shoot_days_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scene_schedule" (
    "sceneId" TEXT NOT NULL,
    "shootDayId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scene_schedule_pkey" PRIMARY KEY ("sceneId", "shootDayId")
);

CREATE UNIQUE INDEX "shoot_days_projectId_dayNumber_key" ON "shoot_days"("projectId", "dayNumber");
CREATE INDEX "shoot_days_projectId_idx" ON "shoot_days"("projectId");
CREATE INDEX "scene_schedule_shootDayId_idx" ON "scene_schedule"("shootDayId");
ALTER TABLE "shoot_days" ADD CONSTRAINT "shoot_days_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scene_schedule" ADD CONSTRAINT "scene_schedule_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scene_schedule" ADD CONSTRAINT "scene_schedule_shootDayId_fkey" FOREIGN KEY ("shootDayId") REFERENCES "shoot_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;