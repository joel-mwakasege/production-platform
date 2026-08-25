CREATE TYPE "ProductionElementCategory" AS ENUM ('CAST', 'CREW', 'LOCATION', 'PROP', 'COSTUME', 'VEHICLE', 'SET_DRESSING', 'OTHER');

CREATE TABLE "production_elements" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductionElementCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "production_elements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scene_elements" (
    "sceneId" TEXT NOT NULL,
    "elementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scene_elements_pkey" PRIMARY KEY ("sceneId", "elementId")
);

CREATE UNIQUE INDEX "production_elements_projectId_name_category_key" ON "production_elements"("projectId", "name", "category");
CREATE INDEX "production_elements_projectId_idx" ON "production_elements"("projectId");
CREATE INDEX "scene_elements_elementId_idx" ON "scene_elements"("elementId");
ALTER TABLE "production_elements" ADD CONSTRAINT "production_elements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scene_elements" ADD CONSTRAINT "scene_elements_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scene_elements" ADD CONSTRAINT "scene_elements_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "production_elements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
