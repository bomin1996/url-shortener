import { Router } from 'express';
import { shortenUrl, getStats } from '../controllers/url.controller';

const router = Router();

router.post('/api/shorten', shortenUrl);
router.get('/api/stats/:shortCode', getStats);

export default router;
