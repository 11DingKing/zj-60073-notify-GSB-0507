import { Router } from 'express';
import * as statisticsController from '../controllers/statisticsController';

const router = Router();

router.get('/overall', statisticsController.getOverallStats);
router.get('/by-channel', statisticsController.getStatsByChannel);
router.get('/by-template', statisticsController.getStatsByTemplate);
router.get('/by-time', statisticsController.getStatsByTime);

export default router;
