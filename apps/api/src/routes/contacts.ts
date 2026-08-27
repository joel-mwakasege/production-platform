import type { RequestHandler } from 'express';
import { z } from 'zod';
import { database } from '@production-platform/database';
import { authorizeProjectRequest } from './projects.js';

const ContactCategoryEnum = z.enum([
  'CAST',
  'CREW',
  'CLIENT',
  'VENDOR',
  'LOCATION',
  'PRODUCTION',
  'OTHER',
]);

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  company: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(1000).optional(),
  category: ContactCategoryEnum.default('CREW'),
});

const locationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().max(300).optional(),
  description: z.string().trim().max(1000).optional(),
  parking: z.string().trim().max(500).optional(),
  basecamp: z.string().trim().max(500).optional(),
  nearestHospital: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const listContactsHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  if (!context) {
    res.status(403).json({ error: 'Project membership required' });
    return;
  }

  const contacts = await database.contact.findMany({
    where: { projectId: context.projectId },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  res.json({ contacts });
};

export const createContactHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  if (!context) {
    res.status(403).json({ error: 'Project membership required' });
    return;
  }

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid contact payload', details: parsed.error.format() });
    return;
  }

  const contact = await database.contact.create({
    data: {
      projectId: context.projectId,
      name: parsed.data.name,
      role: parsed.data.role || null,
      department: parsed.data.department || null,
      company: parsed.data.company || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      category: parsed.data.category,
    },
  });

  res.status(201).json({ contact });
};

export const deleteContactHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  const contactId = typeof req.params.contactId === 'string' ? req.params.contactId : null;
  if (!context || !contactId) {
    res.status(403).json({ error: 'Project membership required' });
    return;
  }

  const existing = await database.contact.findFirst({
    where: { id: contactId, projectId: context.projectId },
    select: { id: true },
  });

  if (!existing) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }

  await database.contact.delete({
    where: { id: contactId },
  });

  res.status(204).send();
};

export const listLocationsHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  if (!context) {
    res.status(403).json({ error: 'Project membership required' });
    return;
  }

  const locations = await database.location.findMany({
    where: { projectId: context.projectId },
    orderBy: { name: 'asc' },
  });

  res.json({ locations });
};

export const createLocationHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  if (!context) {
    res.status(403).json({ error: 'Project membership required' });
    return;
  }

  const parsed = locationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid location payload', details: parsed.error.format() });
    return;
  }

  const location = await database.location.create({
    data: {
      projectId: context.projectId,
      name: parsed.data.name,
      address: parsed.data.address || null,
      description: parsed.data.description || null,
      parking: parsed.data.parking || null,
      basecamp: parsed.data.basecamp || null,
      nearestHospital: parsed.data.nearestHospital || null,
      notes: parsed.data.notes || null,
    },
  });

  res.status(201).json({ location });
};

export const deleteLocationHandler: RequestHandler = async (req, res): Promise<void> => {
  const context = await authorizeProjectRequest(req);
  const locationId = typeof req.params.locationId === 'string' ? req.params.locationId : null;
  if (!context || !locationId) {
    res.status(403).json({ error: 'Project membership required' });
    return;
  }

  const existing = await database.location.findFirst({
    where: { id: locationId, projectId: context.projectId },
    select: { id: true },
  });

  if (!existing) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }

  await database.location.delete({
    where: { id: locationId },
  });

  res.status(204).send();
};
