import { Router } from 'express';
import * as channelController from '../controllers/channelController';

const router = Router();

router.get('/', channelController.listChannels);
router.post('/', channelController.createChannel);

router.get('/:id', channelController.getChannel);
router.put('/:id', channelController.updateChannel);
router.delete('/:id', channelController.deleteChannel);

router.get('/:channelId/providers', channelController.listProviders);
router.post('/:channelId/providers', channelController.createProvider);

export default router;
