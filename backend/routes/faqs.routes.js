import { Router } from 'express';
import handler from '../controllers/faqs.controller.js';

const router = Router();
router.all('/', handler);

export default router;
