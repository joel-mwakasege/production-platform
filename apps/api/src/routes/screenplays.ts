import { randomUUID } from 'crypto';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { database } from '@production-platform/database';
import { authorizeProjectRequest } from './projects';

// Define the exact types supported by our new database model
const ScreenplayElementTypeEnum = z.enum([
  'SCENE_HEADING',
  'ACTION',
  'CHARACTER',
  'DIALOGUE',
  'PARENTHETICAL',
  'TRANSITION',
  'SHOT'
]);

// Upgrade the payload validation to accept structured blocks
const screenplaySchema = z.object({
  title: z.string().trim().min(1).max(160).default('Screenplay'),
  scenes: z.array(z.object({
    sceneNumber: z.number().int().positive(),
    heading: z.string().trim().min(1).max(200),
    body: z.string().max(10000).default(''), // Kept for backwards compatibility during transition
    scriptElements: z.array(z.object({
      type: ScreenplayElementTypeEnum,
      content: z.string().max(10000),
    })).default([]) // Defaults to empty array so old frontend saves don't crash
  })).max(500),
});

export const getScreenplayHandler: RequestHandler = async (req, res): Promise<void> => {
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
          include: { scriptElements: { orderBy: { position: 'asc' } } }
        } 
      },
    });
    res.json({ screenplay });
  } catch (err: any) {
    console.error('Error in getScreenplayHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to get screenplay' });
  }
};

export const saveScreenplayHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const context = await authorizeProjectRequest(req);
    if (!context) {
      res.status(403).json({ error: 'Project membership required' });
      return;
    }

    const parsed = screenplaySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid screenplay payload' });
      return;
    }

    const sceneNumbers = parsed.data.scenes.map((scene) => scene.sceneNumber);
    if (new Set(sceneNumbers).size !== sceneNumbers.length) {
      res.status(400).json({ error: 'Scene numbers must be unique' });
      return;
    }

    const screenplay = await database.$transaction(async (transaction) => {
      const current = await transaction.screenplay.upsert({
        where: { projectId: context.projectId },
        create: { projectId: context.projectId, title: parsed.data.title },
        update: { title: parsed.data.title },
      });

      await transaction.scene.deleteMany({ where: { screenplayId: current.id } });

      const scenesToCreate: any[] = [];
      const elementsToCreate: any[] = [];

      parsed.data.scenes.forEach((scene) => {
        const sceneId = randomUUID();
        scenesToCreate.push({
          id: sceneId,
          screenplayId: current.id,
          sceneNumber: scene.sceneNumber,
          heading: scene.heading,
          body: scene.body,
        });

        scene.scriptElements.forEach((el, index) => {
          elementsToCreate.push({
            id: randomUUID(),
            sceneId: sceneId,
            type: el.type,
            content: el.content,
            position: index, 
          });
        });
      });

      if (scenesToCreate.length > 0) {
        await transaction.scene.createMany({ data: scenesToCreate });
      }
      if (elementsToCreate.length > 0) {
        await transaction.screenplayElement.createMany({ data: elementsToCreate });
      }

      return transaction.screenplay.findUnique({ 
        where: { id: current.id }, 
        include: { 
          scenes: { 
            orderBy: { sceneNumber: 'asc' },
            include: { scriptElements: { orderBy: { position: 'asc' } } }
          } 
        } 
      });
    });

    res.json({ screenplay });
  } catch (err: any) {
    console.error('Error in saveScreenplayHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to save screenplay' });
  }
};