import { Router } from 'express';
import handler from '../controllers/config.controller.js';

const router = Router();
router.all('/', handler);

export default router;
