import type { RequestHandler, Response } from 'express';
import { z } from 'zod';
import { database } from '@production-platform/database';
import { slugify } from '../lib/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

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

  const organization = await database.organization.create({
    data: {
      name,
      slug: organizationSlug,
      members: {
        create: {
          profileId: profile.id,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: true,
    },
  });

  res.status(201).json({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    role: organization.members[0]?.role ?? 'OWNER',
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
