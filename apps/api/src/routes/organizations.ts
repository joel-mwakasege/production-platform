import type { RequestHandler, Response } from 'express';
import { z } from 'zod';
import { database } from '@production-platform/database';
import { slugify } from '../lib/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

const demoScenes = [
  { sceneNumber: 1, heading: 'EXT. BUS STOP - DAWN', body: 'MAYA, 19, waits alone as the city wakes. A red scarf moves in the cold wind.' },
  { sceneNumber: 2, heading: 'INT. MAYA\'S APARTMENT - MORNING', body: 'Maya finds an unmarked envelope beneath the door. Inside: a photograph of her mother and one sentence: COME TO THE RIVER.' },
  { sceneNumber: 3, heading: 'EXT. MARKET STREET - DAY', body: 'Maya crosses a crowded market, following a stranger in a yellow coat. She loses him at a flower stall.' },
  { sceneNumber: 4, heading: 'EXT. RIVERBANK - GOLDEN HOUR', body: 'At the river, Maya meets ELIAS, 24. He returns the missing half of the photograph. Neither says what they already know.' },
  { sceneNumber: 5, heading: 'EXT. RIVERBRIDGE - NIGHT', body: 'Lights ripple across the water. Maya and Elias walk toward the bridge, carrying the truth between them.' },
];

const demoElements = [
  { name: 'Maya', category: 'CAST' as const, scenes: [1, 2, 3, 4, 5] },
  { name: 'Elias', category: 'CAST' as const, scenes: [4, 5] },
  { name: 'Bus stop', category: 'LOCATION' as const, scenes: [1] },
  { name: "Maya's apartment", category: 'LOCATION' as const, scenes: [2] },
  { name: 'Market street', category: 'LOCATION' as const, scenes: [3] },
  { name: 'Riverbank', category: 'LOCATION' as const, scenes: [4] },
  { name: 'Red scarf', category: 'COSTUME' as const, scenes: [1, 5] },
  { name: 'Photograph', category: 'PROP' as const, scenes: [2, 4] },
  { name: 'Unmarked envelope', category: 'PROP' as const, scenes: [2] },
];

async function createDemoProject(transaction: Parameters<Parameters<typeof database.$transaction>[0]>[0], organizationId: string, profileId: string) {
  const project = await transaction.project.create({
    data: {
      organizationId,
      name: 'The Last Light',
      slug: 'the-last-light',
      description: 'A young woman follows a photograph through one last day of secrets and light.',
      projectType: 'FILM',
      client: 'Lumen Pictures',
      status: 'ACTIVE',
      startDate: new Date('2026-09-14T00:00:00.000Z'),
      endDate: new Date('2026-09-18T00:00:00.000Z'),
      members: { create: { profileId, role: 'OWNER' } },
      screenplay: { create: { title: 'The Last Light - Screenplay', scenes: { create: demoScenes } } },
      tasks: { create: [
        { title: 'Lock the opening scene', completed: true, dueDate: new Date('2026-09-10T00:00:00.000Z') },
        { title: 'Confirm riverbank location permit', completed: true, dueDate: new Date('2026-09-11T00:00:00.000Z') },
        { title: 'Complete scene 04 breakdown', dueDate: new Date('2026-09-12T00:00:00.000Z') },
        { title: 'Publish the first shooting schedule', dueDate: new Date('2026-09-13T00:00:00.000Z') },
        { title: 'Prepare the night shoot checklist', dueDate: new Date('2026-09-17T00:00:00.000Z') },
      ] },
    },
    select: { id: true, name: true, slug: true, description: true, projectType: true, client: true, status: true, startDate: true, endDate: true },
  });

  const screenplay = await transaction.screenplay.findUniqueOrThrow({ where: { projectId: project.id }, select: { id: true } });
  const scenes = await transaction.scene.findMany({ where: { screenplayId: screenplay.id }, select: { id: true, sceneNumber: true } });
  const sceneIds = new Map(scenes.map((scene) => [scene.sceneNumber, scene.id]));
  for (const demoElement of demoElements) {
    const element = await transaction.productionElement.create({ data: { projectId: project.id, name: demoElement.name, category: demoElement.category } });
    await transaction.sceneElement.createMany({ data: demoElement.scenes.map((sceneNumber) => ({ sceneId: sceneIds.get(sceneNumber)!, elementId: element.id })) });
  }

  const shootDays = await Promise.all([
    transaction.shootDay.create({ data: { projectId: project.id, dayNumber: 1, date: new Date('2026-09-14T00:00:00.000Z'), label: 'Dawn and city exteriors' } }),
    transaction.shootDay.create({ data: { projectId: project.id, dayNumber: 2, date: new Date('2026-09-15T00:00:00.000Z'), label: 'Apartment and market' } }),
    transaction.shootDay.create({ data: { projectId: project.id, dayNumber: 3, date: new Date('2026-09-17T00:00:00.000Z'), label: 'River and night bridge' } }),
  ]);
  await transaction.sceneSchedule.createMany({ data: [
    { sceneId: sceneIds.get(1)!, shootDayId: shootDays[0].id, position: 1 },
    { sceneId: sceneIds.get(2)!, shootDayId: shootDays[1].id, position: 1 },
    { sceneId: sceneIds.get(3)!, shootDayId: shootDays[1].id, position: 2 },
    { sceneId: sceneIds.get(4)!, shootDayId: shootDays[2].id, position: 1 },
    { sceneId: sceneIds.get(5)!, shootDayId: shootDays[2].id, position: 2 },
  ] });
  return project;
}

export const createOrganizationHandler: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const parsed = createOrganizationSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid organization payload' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized request' });
    return;
  }

  const { name } = parsed.data;
  const slug = slugify(name);
  if (!slug) {
    res.status(400).json({ error: 'Organization name must contain a letter or number' });
    return;
  }

  let organizationSlug = slug;
  let suffix = 2;
  while (await database.organization.findUnique({ where: { slug: organizationSlug } })) {
    organizationSlug = `${slug}-${suffix}`;
    suffix += 1;
  }

  const profile = await database.profile.findFirst({
    where: { id: req.user.id },
  });

  if (!profile) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  const { organization, demoProject } = await database.$transaction(async (transaction) => {
    const createdOrganization = await transaction.organization.create({
      data: { name, slug: organizationSlug, members: { create: { profileId: profile.id, role: 'OWNER' } } },
      select: { id: true, name: true, slug: true },
    });
    const createdDemoProject = await createDemoProject(transaction, createdOrganization.id, profile.id);
    return { organization: createdOrganization, demoProject: createdDemoProject };
  });

  res.status(201).json({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    role: 'OWNER',
    demoProject,
  });
};

export const listOrganizationsHandler: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized request' });
    return;
  }

  const memberships = await database.organizationMember.findMany({
    where: { profileId: req.user.id },
    orderBy: { createdAt: 'asc' },
    select: {
      role: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  res.json({
    organizations: memberships.map(({ organization, role }) => ({ ...organization, role })),
  });
};
