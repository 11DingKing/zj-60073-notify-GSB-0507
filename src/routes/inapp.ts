import { Router } from 'express';
import * as inAppController from '../controllers/inAppController';

const router = Router();

router.get('/:userId', inAppController.getMessages);
router.get('/:userId/unread-count', inAppController.getUnreadCount);
router.get('/:userId/:messageId', inAppController.getMessage);

router.post('/:userId/:messageId/read', inAppController.markAsRead);
router.post('/:userId/read-all', inAppController.markAllAsRead);

export default router;
