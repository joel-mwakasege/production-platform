import type { RequestHandler } from 'express';
import { z } from 'zod';
import { database } from '@production-platform/database';
import { authorizeProjectRequest } from './projects';

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
  role: z.string().trim().max(120).optional().nullable(),
  department: z.string().trim().max(120).optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().max(160).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  category: ContactCategoryEnum.default('CREW'),
});

const updateContactSchema = contactSchema.partial();

const locationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  address: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  parking: z.string().trim().max(500).optional().nullable(),
  basecamp: z.string().trim().max(500).optional().nullable(),
  nearestHospital: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

const updateLocationSchema = locationSchema.partial();

export const listContactsHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
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
  } catch (err: any) {
    console.error('Error in listContactsHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to list contacts' });
  }
};

export const createContactHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
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
  } catch (err: any) {
    console.error('Error in createContactHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to create contact' });
  }
};

export const updateContactHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const context = await authorizeProjectRequest(req);
    const contactId = typeof req.params.contactId === 'string' ? req.params.contactId : null;
    if (!context || !contactId) {
      res.status(403).json({ error: 'Project membership required' });
      return;
    }

    const parsed = updateContactSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid contact payload', details: parsed.error.format() });
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

    const contact = await database.contact.update({
      where: { id: contactId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.role !== undefined ? { role: parsed.data.role || null } : {}),
        ...(parsed.data.department !== undefined ? { department: parsed.data.department || null } : {}),
        ...(parsed.data.company !== undefined ? { company: parsed.data.company || null } : {}),
        ...(parsed.data.email !== undefined ? { email: parsed.data.email || null } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone || null } : {}),
        ...(parsed.data.address !== undefined ? { address: parsed.data.address || null } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
        ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
      },
    });

    res.json({ contact });
  } catch (err: any) {
    console.error('Error in updateContactHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to update contact' });
  }
};

export const deleteContactHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
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
  } catch (err: any) {
    console.error('Error in deleteContactHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to delete contact' });
  }
};

export const listLocationsHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
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
  } catch (err: any) {
    console.error('Error in listLocationsHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to list locations' });
  }
};

export const createLocationHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
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
  } catch (err: any) {
    console.error('Error in createLocationHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to create location' });
  }
};

export const updateLocationHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const context = await authorizeProjectRequest(req);
    const locationId = typeof req.params.locationId === 'string' ? req.params.locationId : null;
    if (!context || !locationId) {
      res.status(403).json({ error: 'Project membership required' });
      return;
    }

    const parsed = updateLocationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid location payload', details: parsed.error.format() });
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

    const location = await database.location.update({
      where: { id: locationId },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.address !== undefined ? { address: parsed.data.address || null } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description || null } : {}),
        ...(parsed.data.parking !== undefined ? { parking: parsed.data.parking || null } : {}),
        ...(parsed.data.basecamp !== undefined ? { basecamp: parsed.data.basecamp || null } : {}),
        ...(parsed.data.nearestHospital !== undefined ? { nearestHospital: parsed.data.nearestHospital || null } : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
      },
    });

    res.json({ location });
  } catch (err: any) {
    console.error('Error in updateLocationHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to update location' });
  }
};

export const deleteLocationHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
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
  } catch (err: any) {
    console.error('Error in deleteLocationHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to delete location' });
  }
};
