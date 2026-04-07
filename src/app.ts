import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { globalLimiter, redirectLimiter } from './middleware/rateLimiter';
import urlRoutes from './routes/url.route';
import { redirectUrl } from './controllers/url.controller';

const app = express();

app.use(express.json());
app.use(globalLimiter);

// Swagger API 문서
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(urlRoutes);
app.get('/:shortCode', redirectLimiter, redirectUrl);

export default app;
