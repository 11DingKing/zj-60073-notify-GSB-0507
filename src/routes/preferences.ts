import { Router } from 'express';
import * as preferenceController from '../controllers/preferenceController';

const router = Router();

router.get('/:userId', preferenceController.getPreferences);
router.post('/:userId', preferenceController.setPreferences);

router.get('/:userId/:channelId/:notificationType', preferenceController.getPreference);
router.delete('/:userId/:channelId/:notificationType', preferenceController.deletePreference);

export default router;
