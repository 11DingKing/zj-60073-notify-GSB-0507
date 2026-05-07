import { Router } from 'express';
import * as templateController from '../controllers/templateController';

const router = Router();

router.get('/', templateController.listTemplates);
router.post('/', templateController.createTemplate);
router.post('/render', templateController.renderTemplate);

router.get('/code/:code', templateController.getTemplateByCode);
router.get('/:id', templateController.getTemplate);
router.get('/:id/versions', templateController.getTemplateVersions);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);

export default router;
