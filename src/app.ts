import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: '多渠道消息通知中心 API',
}));

app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({
    name: '多渠道消息通知中心',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/api/health',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
