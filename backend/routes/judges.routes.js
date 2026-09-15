import { Router } from 'express';
import handler from '../controllers/judges.controller.js';

const router = Router();
router.all('/', handler);

export default router;
