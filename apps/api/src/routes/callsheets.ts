import type { RequestHandler } from 'express';
import { z } from 'zod';
import { database } from '@production-platform/database';
import { authorizeProjectRequest } from './projects';

const castCallItemSchema = z.object({
  id: z.string().optional(),
  castNumber: z.string().trim().max(20).optional().nullable(),
  characterName: z.string().trim().min(1).max(120),
  actorName: z.string().trim().min(1).max(120),
  status: z.enum(['W', 'H', 'R', 'T', 'O']).optional().nullable(), // Work, Hold, Rehearse, Travel, Off
  pickupTime: z.string().trim().max(40).optional().nullable(),
  hmuCall: z.string().trim().max(40).optional().nullable(),
  onSetCall: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(300).optional().nullable(),
  position: z.number().int().min(0).default(0),
});

const createCallSheetSchema = z.object({
  shootDayId: z.string().uuid(),
  title: z.string().trim().max(160).optional().nullable(),
  generalCrewCall: z.string().trim().max(40).optional().nullable(),
  breakfastTime: z.string().trim().max(40).optional().nullable(),
  firstShotTime: z.string().trim().max(40).optional().nullable(),
  lunchTime: z.string().trim().max(40).optional().nullable(),
  estimatedWrap: z.string().trim().max(40).optional().nullable(),
  weatherNotes: z.string().trim().max(300).optional().nullable(),
  locationName: z.string().trim().max(160).optional().nullable(),
  locationAddress: z.string().trim().max(300).optional().nullable(),
  parkingNotes: z.string().trim().max(500).optional().nullable(),
  basecampNotes: z.string().trim().max(500).optional().nullable(),
  nearestHospital: z.string().trim().max(500).optional().nullable(),
  generalNotes: z.string().trim().max(2000).optional().nullable(),
  departmentNotes: z.string().trim().max(2000).optional().nullable(),
  castCalls: z.array(castCallItemSchema).optional(),
});

const updateCallSheetSchema = createCallSheetSchema.partial();

export const listCallSheetsHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const context = await authorizeProjectRequest(req);
    if (!context) {
      res.status(403).json({ error: 'Project membership required' });
      return;
    }

    const callSheets = await database.callSheet.findMany({
      where: { projectId: context.projectId },
      include: {
        shootDay: {
          include: {
            scenes: {
              orderBy: { position: 'asc' },
              include: { scene: true },
            },
          },
        },
        castCalls: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { shootDay: { dayNumber: 'asc' } },
    });

    res.json({ callSheets });
  } catch (err: any) {
    console.error('Error in listCallSheetsHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to list call sheets' });
  }
};

export const getCallSheetByDayHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const context = await authorizeProjectRequest(req);
    const shootDayId = typeof req.params.shootDayId === 'string' ? req.params.shootDayId : null;
    if (!context || !shootDayId) {
      res.status(403).json({ error: 'Project membership required' });
      return;
    }

    const shootDay = await database.shootDay.findFirst({
      where: { id: shootDayId, projectId: context.projectId },
      include: {
        scenes: {
          orderBy: { position: 'asc' },
          include: { scene: true },
        },
      },
    });

    if (!shootDay) {
      res.status(404).json({ error: 'Shoot day not found' });
      return;
    }

    let callSheet = await database.callSheet.findUnique({
      where: { shootDayId },
      include: {
        castCalls: { orderBy: { position: 'asc' } },
      },
    });

    // Auto-create initial default call sheet if one doesn't exist yet for this shoot day
    if (!callSheet) {
      // Find first project location if available as default
      const defaultLocation = await database.location.findFirst({
        where: { projectId: context.projectId },
        orderBy: { createdAt: 'asc' },
      });

      // Find project cast contacts to pre-fill initial cast call roster
      const castContacts = await database.contact.findMany({
        where: { projectId: context.projectId, category: 'CAST' },
        orderBy: { name: 'asc' },
      });

      callSheet = await database.callSheet.create({
        data: {
          projectId: context.projectId,
          shootDayId: shootDay.id,
          title: `Day ${shootDay.dayNumber} Call Sheet`,
          generalCrewCall: '07:00 AM',
          breakfastTime: '06:30 AM',
          firstShotTime: '08:00 AM',
          lunchTime: '01:00 PM',
          estimatedWrap: '07:00 PM',
          weatherNotes: 'Clear & Sunny, 72°F / Sunrise 06:15 AM / Sunset 07:45 PM',
          locationName: defaultLocation?.name || null,
          locationAddress: defaultLocation?.address || null,
          parkingNotes: defaultLocation?.parking || null,
          basecampNotes: defaultLocation?.basecamp || null,
          nearestHospital: defaultLocation?.nearestHospital || null,
          castCalls: {
            create: castContacts.map((c, idx) => ({
              castNumber: String(idx + 1),
              characterName: c.role || 'Character',
              actorName: c.name,
              status: 'W',
              pickupTime: '06:15 AM',
              hmuCall: '06:45 AM',
              onSetCall: '07:45 AM',
              position: idx,
            })),
          },
        },
        include: {
          castCalls: { orderBy: { position: 'asc' } },
        },
      });
    }

    res.json({
      callSheet: {
        ...callSheet,
        shootDay,
      },
    });
  } catch (err: any) {
    console.error('Error in getCallSheetByDayHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to get call sheet' });
  }
};

export const saveCallSheetHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const context = await authorizeProjectRequest(req);
    if (!context) {
      res.status(403).json({ error: 'Project membership required' });
      return;
    }

    const parsed = updateCallSheetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid call sheet payload', details: parsed.error.format() });
      return;
    }

    const shootDayId = parsed.data.shootDayId || (typeof req.params.shootDayId === 'string' ? req.params.shootDayId : null);
    if (!shootDayId) {
      res.status(400).json({ error: 'shootDayId is required' });
      return;
    }

    const shootDay = await database.shootDay.findFirst({
      where: { id: shootDayId, projectId: context.projectId },
      select: { id: true },
    });
    if (!shootDay) {
      res.status(404).json({ error: 'Shoot day not found' });
      return;
    }

    const updated = await database.$transaction(async (tx) => {
      const callSheet = await tx.callSheet.upsert({
        where: { shootDayId },
        create: {
          projectId: context.projectId,
          shootDayId,
          title: parsed.data.title || null,
          generalCrewCall: parsed.data.generalCrewCall || null,
          breakfastTime: parsed.data.breakfastTime || null,
          firstShotTime: parsed.data.firstShotTime || null,
          lunchTime: parsed.data.lunchTime || null,
          estimatedWrap: parsed.data.estimatedWrap || null,
          weatherNotes: parsed.data.weatherNotes || null,
          locationName: parsed.data.locationName || null,
          locationAddress: parsed.data.locationAddress || null,
          parkingNotes: parsed.data.parkingNotes || null,
          basecampNotes: parsed.data.basecampNotes || null,
          nearestHospital: parsed.data.nearestHospital || null,
          generalNotes: parsed.data.generalNotes || null,
          departmentNotes: parsed.data.departmentNotes || null,
        },
        update: {
          ...(parsed.data.title !== undefined ? { title: parsed.data.title || null } : {}),
          ...(parsed.data.generalCrewCall !== undefined ? { generalCrewCall: parsed.data.generalCrewCall || null } : {}),
          ...(parsed.data.breakfastTime !== undefined ? { breakfastTime: parsed.data.breakfastTime || null } : {}),
          ...(parsed.data.firstShotTime !== undefined ? { firstShotTime: parsed.data.firstShotTime || null } : {}),
          ...(parsed.data.lunchTime !== undefined ? { lunchTime: parsed.data.lunchTime || null } : {}),
          ...(parsed.data.estimatedWrap !== undefined ? { estimatedWrap: parsed.data.estimatedWrap || null } : {}),
          ...(parsed.data.weatherNotes !== undefined ? { weatherNotes: parsed.data.weatherNotes || null } : {}),
          ...(parsed.data.locationName !== undefined ? { locationName: parsed.data.locationName || null } : {}),
          ...(parsed.data.locationAddress !== undefined ? { locationAddress: parsed.data.locationAddress || null } : {}),
          ...(parsed.data.parkingNotes !== undefined ? { parkingNotes: parsed.data.parkingNotes || null } : {}),
          ...(parsed.data.basecampNotes !== undefined ? { basecampNotes: parsed.data.basecampNotes || null } : {}),
          ...(parsed.data.nearestHospital !== undefined ? { nearestHospital: parsed.data.nearestHospital || null } : {}),
          ...(parsed.data.generalNotes !== undefined ? { generalNotes: parsed.data.generalNotes || null } : {}),
          ...(parsed.data.departmentNotes !== undefined ? { departmentNotes: parsed.data.departmentNotes || null } : {}),
        },
      });

      // Update cast calls if provided
      if (parsed.data.castCalls) {
        await tx.castCall.deleteMany({ where: { callSheetId: callSheet.id } });
        if (parsed.data.castCalls.length > 0) {
          await tx.castCall.createMany({
            data: parsed.data.castCalls.map((cc, index) => ({
              callSheetId: callSheet.id,
              castNumber: cc.castNumber || null,
              characterName: cc.characterName,
              actorName: cc.actorName,
              status: cc.status || 'W',
              pickupTime: cc.pickupTime || null,
              hmuCall: cc.hmuCall || null,
              onSetCall: cc.onSetCall || null,
              notes: cc.notes || null,
              position: cc.position ?? index,
            })),
          });
        }
      }

      return tx.callSheet.findUnique({
        where: { id: callSheet.id },
        include: {
          shootDay: {
            include: {
              scenes: {
                orderBy: { position: 'asc' },
                include: { scene: true },
              },
            },
          },
          castCalls: {
            orderBy: { position: 'asc' },
          },
        },
      });
    });

    res.json({ callSheet: updated });
  } catch (err: any) {
    console.error('Error in saveCallSheetHandler:', err);
    res.status(500).json({ error: err.message || 'Failed to save call sheet' });
  }
};
