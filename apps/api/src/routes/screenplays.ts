import type { RequestHandler } from 'express';
import { z } from 'zod';
import { database } from '@production-platform/database';
import { authorizeProjectRequest } from './projects.js';

const screenplaySchema = z.object({
  title: z.string().trim().min(1).max(160).default('Screenplay'),
  scenes: z.array(z.object({
    sceneNumber: z.number().int().positive(),
    heading: z.string().trim().min(1).max(200),
    body: z.string().max(10000),
  })).max(500),
});

export const getScreenplayHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  if (!context) {
    res.status(403).json({ error: 'Project membership required' });
    return;
  }

  const screenplay = await database.screenplay.findUnique({
    where: { projectId: context.projectId },
    include: { scenes: { orderBy: { sceneNumber: 'asc' } } },
  });
  res.json({ screenplay });
};

export const saveScreenplayHandler: RequestHandler = async (req, res): Promise<void> => {
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
    await transaction.scene.createMany({
      data: parsed.data.scenes.map((scene) => ({ ...scene, screenplayId: current.id })),
    });
    return transaction.screenplay.findUnique({ where: { id: current.id }, include: { scenes: { orderBy: { sceneNumber: 'asc' } } } });
  });

  res.json({ screenplay });
};