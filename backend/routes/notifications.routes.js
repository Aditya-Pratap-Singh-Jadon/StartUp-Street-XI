import { Router } from 'express';
import handler from '../controllers/notifications.controller.js';

const router = Router();
router.all('/', handler);

export default router;
