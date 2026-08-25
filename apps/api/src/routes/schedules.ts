import type { RequestHandler } from 'express';
import { z } from 'zod';
import { database } from '@production-platform/database';
import { authorizeProjectRequest } from './projects.js';

const shootDaySchema = z.object({ date: z.coerce.date(), label: z.string().trim().max(120).optional() });
const assignmentSchema = z.object({ sceneId: z.string().uuid(), position: z.number().int().min(0).default(0) });

export const getScheduleHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  if (!context) { res.status(403).json({ error: 'Project membership required' }); return; }
  const shootDays = await database.shootDay.findMany({
    where: { projectId: context.projectId }, orderBy: { dayNumber: 'asc' },
    include: { scenes: { orderBy: { position: 'asc' }, include: { scene: true } } },
  });
  res.json({ shootDays });
};

export const createShootDayHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  if (!context) { res.status(403).json({ error: 'Project membership required' }); return; }
  const parsed = shootDaySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid shoot day payload' }); return; }
  const lastDay = await database.shootDay.findFirst({ where: { projectId: context.projectId }, orderBy: { dayNumber: 'desc' }, select: { dayNumber: true } });
  const shootDay = await database.shootDay.create({ data: { projectId: context.projectId, dayNumber: (lastDay?.dayNumber ?? 0) + 1, date: parsed.data.date, label: parsed.data.label || null } });
  res.status(201).json({ shootDay });
};

export const assignSceneHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  const shootDayId = typeof req.params.shootDayId === 'string' ? req.params.shootDayId : null;
  if (!context || !shootDayId) { res.status(403).json({ error: 'Project membership required' }); return; }
  const parsed = assignmentSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid scene assignment payload' }); return; }
  const shootDay = await database.shootDay.findFirst({ where: { id: shootDayId, projectId: context.projectId }, select: { id: true } });
  const scene = await database.scene.findFirst({ where: { id: parsed.data.sceneId, screenplay: { projectId: context.projectId } }, select: { id: true } });
  if (!shootDay || !scene) { res.status(404).json({ error: 'Shoot day or scene not found' }); return; }
  const assignment = await database.sceneSchedule.upsert({ where: { sceneId_shootDayId: { sceneId: scene.id, shootDayId } }, create: { sceneId: scene.id, shootDayId, position: parsed.data.position }, update: { position: parsed.data.position }, include: { scene: true } });
  res.status(201).json({ assignment });
};