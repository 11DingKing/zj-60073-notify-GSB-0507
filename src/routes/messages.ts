import { Router } from 'express';
import * as messageController from '../controllers/messageController';

const router = Router();

router.post('/send', messageController.sendSingle);
router.post('/send-batch', messageController.sendBatch);

router.get('/', messageController.listMessages);
router.get('/:id', messageController.getMessage);
router.post('/:id/retry', messageController.retryMessage);

export default router;
