import express from 'express';
import urlRoutes from './routes/url.route';
import { redirectUrl } from './controllers/url.controller';

const app = express();

app.use(express.json());
app.use(urlRoutes);
app.get('/:shortCode', redirectUrl);

export default app;
