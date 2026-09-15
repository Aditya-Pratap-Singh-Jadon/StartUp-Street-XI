import { Router } from 'express';
import handler from '../controllers/teams.controller.js';

const router = Router();
router.all('/', handler);

export default router;
