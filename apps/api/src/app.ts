import cors from 'cors';
import express, { Router } from 'express';
import { requireAuth } from './middleware/auth';
import { createOrganizationHandler, listOrganizationsHandler } from './routes/organizations';
import {
  createProjectHandler,
  createTaskHandler,
  getProjectHandler,
  listProjectsHandler,
  listTasksHandler,
  updateTaskHandler,
} from './routes/projects';
import { getScreenplayHandler, saveScreenplayHandler } from './routes/screenplays';
import {
  addBreakdownElementHandler,
  getBreakdownHandler,
  removeBreakdownElementHandler,
} from './routes/breakdowns';
import { assignSceneHandler, createShootDayHandler, getScheduleHandler } from './routes/schedules';
import {
  createContactHandler,
  createLocationHandler,
  deleteContactHandler,
  deleteLocationHandler,
  listContactsHandler,
  listLocationsHandler,
  updateContactHandler,
  updateLocationHandler,
} from './routes/contacts';
import {
  getCallSheetByDayHandler,
  listCallSheetsHandler,
  saveCallSheetHandler,
} from './routes/callsheets';

const app = express();

const corsOptions: cors.CorsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Base health endpoints
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'production-platform-api' });
});

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'production-platform-api' });
});

// Organizations
router.post('/organizations', requireAuth, createOrganizationHandler);
router.get('/organizations', requireAuth, listOrganizationsHandler);

// Projects & Tasks
router.get('/organizations/:organizationId/projects', requireAuth, listProjectsHandler);
router.get('/organizations/:organizationId/projects/:projectId', requireAuth, getProjectHandler);
router.post('/organizations/:organizationId/projects', requireAuth, createProjectHandler);
router.get('/organizations/:organizationId/projects/:projectId/tasks', requireAuth, listTasksHandler);
router.post('/organizations/:organizationId/projects/:projectId/tasks', requireAuth, createTaskHandler);
router.patch('/organizations/:organizationId/projects/:projectId/tasks/:taskId', requireAuth, updateTaskHandler);

// Screenplays
router.get('/organizations/:organizationId/projects/:projectId/screenplay', requireAuth, getScreenplayHandler);
router.put('/organizations/:organizationId/projects/:projectId/screenplay', requireAuth, saveScreenplayHandler);

// Breakdown
router.get('/organizations/:organizationId/projects/:projectId/breakdown', requireAuth, getBreakdownHandler);
router.post('/organizations/:organizationId/projects/:projectId/breakdown/elements', requireAuth, addBreakdownElementHandler);
router.delete('/organizations/:organizationId/projects/:projectId/breakdown/scenes/:sceneId/elements/:elementId', requireAuth, removeBreakdownElementHandler);

// Schedules
router.get('/organizations/:organizationId/projects/:projectId/schedule', requireAuth, getScheduleHandler);
router.post('/organizations/:organizationId/projects/:projectId/schedule/days', requireAuth, createShootDayHandler);
router.post('/organizations/:organizationId/projects/:projectId/schedule/days/:shootDayId/scenes', requireAuth, assignSceneHandler);

// Contacts
router.get('/organizations/:organizationId/projects/:projectId/contacts', requireAuth, listContactsHandler);
router.post('/organizations/:organizationId/projects/:projectId/contacts', requireAuth, createContactHandler);
router.patch('/organizations/:organizationId/projects/:projectId/contacts/:contactId', requireAuth, updateContactHandler);
router.delete('/organizations/:organizationId/projects/:projectId/contacts/:contactId', requireAuth, deleteContactHandler);

// Locations
router.get('/organizations/:organizationId/projects/:projectId/locations', requireAuth, listLocationsHandler);
router.post('/organizations/:organizationId/projects/:projectId/locations', requireAuth, createLocationHandler);
router.patch('/organizations/:organizationId/projects/:projectId/locations/:locationId', requireAuth, updateLocationHandler);
router.delete('/organizations/:organizationId/projects/:projectId/locations/:locationId', requireAuth, deleteLocationHandler);

// Call Sheets
router.get('/organizations/:organizationId/projects/:projectId/callsheets', requireAuth, listCallSheetsHandler);
router.get('/organizations/:organizationId/projects/:projectId/callsheets/days/:shootDayId', requireAuth, getCallSheetByDayHandler);
router.post('/organizations/:organizationId/projects/:projectId/callsheets', requireAuth, saveCallSheetHandler);
router.patch('/organizations/:organizationId/projects/:projectId/callsheets/:shootDayId', requireAuth, saveCallSheetHandler);

// Mount router on both '/api' and '/' for robust Vercel serverless routing
app.use('/api', router);
app.use('/', router);

// Root fallback
app.get('/', (_req, res) => {
  res.json({ service: 'production-platform-api', status: 'ok' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
