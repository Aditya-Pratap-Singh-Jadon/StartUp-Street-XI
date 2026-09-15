import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database.js';

// Connect to MongoDB
connectDatabase();

import adminsRoutes from './routes/admins.routes.js';
import announcementsRoutes from './routes/announcements.routes.js';
import authRoutes from './routes/auth.routes.js';
import configRoutes from './routes/config.routes.js';
import faqsRoutes from './routes/faqs.routes.js';
import judgesRoutes from './routes/judges.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import resultsRoutes from './routes/results.routes.js';
import statsRoutes from './routes/stats.routes.js';
import submissionsRoutes from './routes/submissions.routes.js';
import teamsRoutes from './routes/teams.routes.js';
import timelineRoutes from './routes/timeline.routes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.use('/api/admins', adminsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/faqs', faqsRoutes);
app.use('/api/judges', judgesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/timeline', timelineRoutes);

export default app;
