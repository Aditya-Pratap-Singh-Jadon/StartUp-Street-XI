import { Router } from 'express';
import handler from '../controllers/timeline.controller.js';

const router = Router();
router.all('/', handler);

export default router;
