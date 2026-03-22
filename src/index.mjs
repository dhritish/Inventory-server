import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/authRoutes.mjs';
import inventoryRoutes from './routes/inventoryRoutes.mjs';
import analyticsRoutes from './routes/analyticsRoutes.mjs';
import checkoutRoutes from './routes/checkoutRoutes.mjs';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import webhooksRouter from './routes/webhooks.mjs';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.mjs';

const PORT = Number(process.env.PORT) || 5000;
const app = express();
const MONGO_URI = process.env.MONGO_ATLAS_URI || process.env.MONGO_URI;

app.use('/razor', webhooksRouter);

app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/checkout', checkoutRoutes);
app.use(errorHandler);

export { app };

export const startServer = async () => {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI or MONGO_ATLAS_URI is required');
  }

  await mongoose.connect(MONGO_URI);
  console.log('connected to mongodb');

  const server = await new Promise((resolve, reject) => {
    const nextServer = app.listen(PORT, () => {
      nextServer.off('error', reject);
      console.log(`server running on port ${PORT}`);
      resolve(nextServer);
    });

    nextServer.once('error', reject);
  });

  const shutdown = async signal => {
    console.log(`received ${signal}, shutting down server`);
    await new Promise((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    await mongoose.disconnect();
    process.exit(0);
  };

  process.once('SIGINT', () => {
    shutdown('SIGINT').catch(error => {
      console.error('error during shutdown', error);
      process.exit(1);
    });
  });

  process.once('SIGTERM', () => {
    shutdown('SIGTERM').catch(error => {
      console.error('error during shutdown', error);
      process.exit(1);
    });
  });

  return server;
};

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    await startServer();
  } catch (error) {
    console.error('failed to start server', error);
    process.exit(1);
  }
}
