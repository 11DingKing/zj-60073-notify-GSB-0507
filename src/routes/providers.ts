import { Router } from 'express';
import * as channelController from '../controllers/channelController';

const router = Router();

router.get('/', channelController.listAllProviders);
router.put('/:id', channelController.updateProvider);
router.delete('/:id', channelController.deleteProvider);

export default router;
