import { Router } from 'express';
import channelsRouter from './channels';
import providersRouter from './providers';
import templatesRouter from './templates';
import messagesRouter from './messages';
import preferencesRouter from './preferences';
import statisticsRouter from './statistics';
import inappRouter from './inapp';

const router = Router();

router.use('/channels', channelsRouter);
router.use('/providers', providersRouter);
router.use('/templates', templatesRouter);
router.use('/messages', messagesRouter);
router.use('/preferences', preferencesRouter);
router.use('/statistics', statisticsRouter);
router.use('/inapp', inappRouter);

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
