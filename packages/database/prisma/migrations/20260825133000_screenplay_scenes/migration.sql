CREATE TABLE "screenplays" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Screenplay',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "screenplays_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scenes" (
    "id" TEXT NOT NULL,
    "screenplayId" TEXT NOT NULL,
    "sceneNumber" INTEGER NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "scenes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "screenplays_projectId_key" ON "screenplays"("projectId");
CREATE UNIQUE INDEX "scenes_screenplayId_sceneNumber_key" ON "scenes"("screenplayId", "sceneNumber");
CREATE INDEX "scenes_screenplayId_idx" ON "scenes"("screenplayId");
ALTER TABLE "screenplays" ADD CONSTRAINT "screenplays_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_screenplayId_fkey" FOREIGN KEY ("screenplayId") REFERENCES "screenplays"("id") ON DELETE CASCADE ON UPDATE CASCADE;