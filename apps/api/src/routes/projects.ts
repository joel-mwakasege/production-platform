import type { Request, RequestHandler } from 'express';
import { z } from 'zod';
import { database } from '@production-platform/database';
import { slugify } from '../lib/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  projectType: z.enum(['FILM', 'TELEVISION', 'COMMERCIAL', 'DOCUMENTARY', 'MUSIC_VIDEO', 'CORPORATE_VIDEO', 'EVENT', 'PHOTOSHOOT', 'OTHER']).default('OTHER'),
  client: z.string().trim().max(160).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).default('PLANNING'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine((project) => !project.startDate || !project.endDate || project.endDate >= project.startDate, {
  message: 'End date must be on or after the start date',
});

const taskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  dueDate: z.coerce.date().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  completed: z.boolean().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

const projectSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  projectType: true,
  client: true,
  status: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function getOrganizationMember(organizationId: string, profileId: string) {
  return database.organizationMember.findUnique({
    where: { organizationId_profileId: { organizationId, profileId } },
  });
}

async function resolveProfileId(req: Request): Promise<string | null> {
  const user = (req as unknown as AuthenticatedRequest).user;
  if (!user) return null;

  const profile = await database.profile.findUnique({ where: { id: user.id } });
  return profile?.id ?? null;
}

function getOrganizationId(req: Request): string | null {
  const organizationId = req.params.organizationId;
  return typeof organizationId === 'string' ? organizationId : null;
}

export const listProjectsHandler: RequestHandler = async (req, res): Promise<void> => {
  const profileId = await resolveProfileId(req);
  if (!profileId) {
    res.status(401).json({ error: 'Unauthorized request' });
    return;
  }

  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(400).json({ error: 'Invalid organization ID' });
    return;
  }

  const membership = await getOrganizationMember(organizationId, profileId);
  if (!membership) {
    res.status(403).json({ error: 'Organization membership required' });
    return;
  }

  const projects = await database.project.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: projectSelect,
  });

  res.json({ projects });
};

export const getProjectHandler: RequestHandler = async (req, res): Promise<void> => {
  const profileId = await resolveProfileId(req);
  if (!profileId) {
    res.status(401).json({ error: 'Unauthorized request' });
    return;
  }

  const organizationId = getOrganizationId(req);
  const projectId = typeof req.params.projectId === 'string' ? req.params.projectId : null;
  if (!organizationId || !projectId) {
    res.status(400).json({ error: 'Invalid project request' });
    return;
  }

  const membership = await getOrganizationMember(organizationId, profileId);
  if (!membership) {
    res.status(403).json({ error: 'Organization membership required' });
    return;
  }

  const project = await database.project.findFirst({
    where: { id: projectId, organizationId },
    select: projectSelect,
  });
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  res.json({ project });
};

export async function authorizeProjectRequest(req: Request) {
  const profileId = await resolveProfileId(req);
  const organizationId = getOrganizationId(req);
  const projectId = typeof req.params.projectId === 'string' ? req.params.projectId : null;
  if (!profileId || !organizationId || !projectId) return null;

  const membership = await getOrganizationMember(organizationId, profileId);
  if (!membership) return null;

  const project = await database.project.findFirst({ where: { id: projectId, organizationId }, select: { id: true } });
  return project ? { organizationId, projectId } : null;
}

export const listTasksHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  if (!context) {
    res.status(403).json({ error: 'Project membership required' });
    return;
  }

  const tasks = await database.task.findMany({
    where: { projectId: context.projectId },
    orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
  });
  res.json({ tasks });
};

export const createTaskHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  if (!context) {
    res.status(403).json({ error: 'Project membership required' });
    return;
  }

  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid task payload' });
    return;
  }

  const task = await database.task.create({
    data: { projectId: context.projectId, title: parsed.data.title, dueDate: parsed.data.dueDate || null },
  });
  res.status(201).json({ task });
};

export const updateTaskHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  const taskId = typeof req.params.taskId === 'string' ? req.params.taskId : null;
  if (!context || !taskId) {
    res.status(403).json({ error: 'Project membership required' });
    return;
  }

  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid task payload' });
    return;
  }

  const existingTask = await database.task.findFirst({ where: { id: taskId, projectId: context.projectId }, select: { id: true } });
  if (!existingTask) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const task = await database.task.update({ where: { id: taskId }, data: parsed.data });
  res.json({ task });
};

export const createProjectHandler: RequestHandler = async (req, res): Promise<void> => {
  const profileId = await resolveProfileId(req);
  if (!profileId) {
    res.status(401).json({ error: 'Unauthorized request' });
    return;
  }

  const organizationId = getOrganizationId(req);
  if (!organizationId) {
    res.status(400).json({ error: 'Invalid organization ID' });
    return;
  }

  const membership = await getOrganizationMember(organizationId, profileId);
  if (!membership) {
    res.status(403).json({ error: 'Organization membership required' });
    return;
  }

  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid project payload' });
    return;
  }

  const slug = slugify(parsed.data.name);
  if (!slug) {
    res.status(400).json({ error: 'Project name must contain a letter or number' });
    return;
  }

  let projectSlug = slug;
  let suffix = 2;
  while (await database.project.findUnique({ where: { organizationId_slug: { organizationId, slug: projectSlug } } })) {
    projectSlug = `${slug}-${suffix}`;
    suffix += 1;
  }

  const project = await database.project.create({
    data: {
      organizationId,
      name: parsed.data.name,
      slug: projectSlug,
      description: parsed.data.description || null,
      projectType: parsed.data.projectType,
      client: parsed.data.client || null,
      status: parsed.data.status,
      startDate: parsed.data.startDate || null,
      endDate: parsed.data.endDate || null,
      members: { create: { profileId, role: 'OWNER' } },
    },
    select: projectSelect,
  });

  res.status(201).json({ ...project, role: 'OWNER' });
};