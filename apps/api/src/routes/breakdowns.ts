import type { RequestHandler } from 'express';
import { z } from 'zod';
import { database } from '@production-platform/database';
import { authorizeProjectRequest } from './projects';

const elementSchema = z.object({
  sceneId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  category: z.enum(['CAST', 'CREW', 'LOCATION', 'PROP', 'COSTUME', 'VEHICLE', 'SET_DRESSING', 'OTHER']),
});

export const getBreakdownHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const context = await authorizeProjectRequest(req);
    if (!context) {
      res.status(403).json({ error: 'Project membership required' });
      return;
    }

    const screenplay = await database.screenplay.findUnique({
      where: { projectId: context.projectId },
      include: {
        scenes: {
          orderBy: { sceneNumber: 'asc' },
          include: { elements: { include: { element: true } } },
        },
      },
    });
    res.json({ scenes: screenplay?.scenes ?? [] });
  } catch (err: any) {
    console.error('Error in getBreakdownHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to get breakdown' });
  }
};

export const addBreakdownElementHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const context = await authorizeProjectRequest(req);
    if (!context) {
      res.status(403).json({ error: 'Project membership required' });
      return;
    }

    const parsed = elementSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid breakdown element payload' });
      return;
    }

    const scene = await database.scene.findFirst({
      where: { id: parsed.data.sceneId, screenplay: { projectId: context.projectId } },
      select: { id: true },
    });
    if (!scene) {
      res.status(404).json({ error: 'Scene not found' });
      return;
    }

    const element = await database.productionElement.upsert({
      where: { projectId_name_category: { projectId: context.projectId, name: parsed.data.name, category: parsed.data.category } },
      create: { projectId: context.projectId, name: parsed.data.name, category: parsed.data.category },
      update: {},
    });
    const sceneElement = await database.sceneElement.upsert({
      where: { sceneId_elementId: { sceneId: scene.id, elementId: element.id } },
      create: { sceneId: scene.id, elementId: element.id },
      update: {},
      include: { element: true },
    });
    res.status(201).json({ sceneElement });
  } catch (err: any) {
    console.error('Error in addBreakdownElementHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to add breakdown element' });
  }
};

export const removeBreakdownElementHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const context = await authorizeProjectRequest(req);
    const sceneId = typeof req.params.sceneId === 'string' ? req.params.sceneId : null;
    const elementId = typeof req.params.elementId === 'string' ? req.params.elementId : null;
    if (!context || !sceneId || !elementId) {
      res.status(403).json({ error: 'Project membership required' });
      return;
    }

    const relation = await database.sceneElement.findFirst({
      where: { sceneId, elementId, scene: { screenplay: { projectId: context.projectId } } },
    });
    if (!relation) {
      res.status(404).json({ error: 'Breakdown element not found' });
      return;
    }

    await database.sceneElement.delete({ where: { sceneId_elementId: { sceneId, elementId } } });
    res.status(204).send();
  } catch (err: any) {
    console.error('Error in removeBreakdownElementHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to remove breakdown element' });
  }
};