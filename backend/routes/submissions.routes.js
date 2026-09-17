import { Router } from 'express';
import handler from '../controllers/submissions.controller.js';

const router = Router();
router.all('/', handler);
router.all('/*', handler);

export default router;
