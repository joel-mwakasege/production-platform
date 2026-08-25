import cors from 'cors';
import express from 'express';
import { requireAuth } from './middleware/auth.js';
import { createOrganizationHandler, listOrganizationsHandler } from './routes/organizations.js';
import { createProjectHandler, createTaskHandler, getProjectHandler, listProjectsHandler, listTasksHandler, updateTaskHandler } from './routes/projects.js';
import { getScreenplayHandler, saveScreenplayHandler } from './routes/screenplays.js';
import { addBreakdownElementHandler, getBreakdownHandler, removeBreakdownElementHandler } from './routes/breakdowns.js';
import { assignSceneHandler, createShootDayHandler, getScheduleHandler } from './routes/schedules.js';

const app = express();
const port = Number(process.env.API_PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    service: 'production-platform-api',
    status: 'ok',
    web: 'http://localhost:5173/',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'production-platform-api',
  });
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

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
