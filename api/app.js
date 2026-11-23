import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOrigins, env } from './config/env.js';
import { UPLOADS_ROOT } from './config/uploads.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFound.js';
import apiRouter from './routes/index.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use('/uploads', express.static(UPLOADS_ROOT, {
  maxAge: '7d',
  index: false,
  setHeaders: (response) => {
    // Uploaded covers are intentionally embedded by the SPA on another origin.
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));
app.use(express.json({ limit: '100kb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
