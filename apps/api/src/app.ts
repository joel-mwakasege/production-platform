import cors from 'cors';
import express from 'express';
import { requireAuth } from './middleware/auth.js';
import { createOrganizationHandler, listOrganizationsHandler } from './routes/organizations.js';
import { createProjectHandler, createTaskHandler, getProjectHandler, listProjectsHandler, listTasksHandler, updateTaskHandler } from './routes/projects.js';
import { getScreenplayHandler, saveScreenplayHandler } from './routes/screenplays.js';
import { addBreakdownElementHandler, getBreakdownHandler, removeBreakdownElementHandler } from './routes/breakdowns.js';
import { assignSceneHandler, createShootDayHandler, getScheduleHandler } from './routes/schedules.js';
import {
  createContactHandler,
  createLocationHandler,
  deleteContactHandler,
  deleteLocationHandler,
  listContactsHandler,
  listLocationsHandler,
  updateContactHandler,
  updateLocationHandler,
} from './routes/contacts.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ service: 'production-platform-api', status: 'ok' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'production-platform-api' });
});

app.post('/api/organizations', requireAuth, createOrganizationHandler);
app.get('/api/organizations', requireAuth, listOrganizationsHandler);
app.get('/api/organizations/:organizationId/projects', requireAuth, listProjectsHandler);
app.get('/api/organizations/:organizationId/projects/:projectId', requireAuth, getProjectHandler);
app.post('/api/organizations/:organizationId/projects', requireAuth, createProjectHandler);
app.get('/api/organizations/:organizationId/projects/:projectId/tasks', requireAuth, listTasksHandler);
app.post('/api/organizations/:organizationId/projects/:projectId/tasks', requireAuth, createTaskHandler);
app.patch('/api/organizations/:organizationId/projects/:projectId/tasks/:taskId', requireAuth, updateTaskHandler);
app.get('/api/organizations/:organizationId/projects/:projectId/screenplay', requireAuth, getScreenplayHandler);
app.put('/api/organizations/:organizationId/projects/:projectId/screenplay', requireAuth, saveScreenplayHandler);
app.get('/api/organizations/:organizationId/projects/:projectId/breakdown', requireAuth, getBreakdownHandler);
app.post('/api/organizations/:organizationId/projects/:projectId/breakdown/elements', requireAuth, addBreakdownElementHandler);
app.delete('/api/organizations/:organizationId/projects/:projectId/breakdown/scenes/:sceneId/elements/:elementId', requireAuth, removeBreakdownElementHandler);
app.get('/api/organizations/:organizationId/projects/:projectId/schedule', requireAuth, getScheduleHandler);
app.post('/api/organizations/:organizationId/projects/:projectId/schedule/days', requireAuth, createShootDayHandler);
app.post('/api/organizations/:organizationId/projects/:projectId/schedule/days/:shootDayId/scenes', requireAuth, assignSceneHandler);
app.get('/api/organizations/:organizationId/projects/:projectId/contacts', requireAuth, listContactsHandler);
app.post('/api/organizations/:organizationId/projects/:projectId/contacts', requireAuth, createContactHandler);
app.patch('/api/organizations/:organizationId/projects/:projectId/contacts/:contactId', requireAuth, updateContactHandler);
app.delete('/api/organizations/:organizationId/projects/:projectId/contacts/:contactId', requireAuth, deleteContactHandler);
app.get('/api/organizations/:organizationId/projects/:projectId/locations', requireAuth, listLocationsHandler);
app.post('/api/organizations/:organizationId/projects/:projectId/locations', requireAuth, createLocationHandler);
app.patch('/api/organizations/:organizationId/projects/:projectId/locations/:locationId', requireAuth, updateLocationHandler);
app.delete('/api/organizations/:organizationId/projects/:projectId/locations/:locationId', requireAuth, deleteLocationHandler);

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