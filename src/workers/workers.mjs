import 'dotenv/config';
import { Worker } from 'bullmq';
import { connection, registerRecurringJobs } from '../queue.mjs';
import * as jobRouter from './jobsRouter.mjs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const MONGO_URI = process.env.MONGO_ATLAS_URI || process.env.MONGO_URI;

export const startWorker = async () => {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI or MONGO_ATLAS_URI is required');
  }

  console.log('worker starting');
  await mongoose.connect(MONGO_URI);
  console.log('connected to mongodb');

  await registerRecurringJobs();

  const worker = new Worker(
    'jobs',
    job => {
      console.log(job.data);
      return jobRouter.processJob(job);
    },
    { connection, concurrency: 5 },
  );

  worker.on('error', error => {
    console.error('worker error', error);
  });

  worker.on('failed', (job, error) => {
    console.error(`job failed: ${job?.name ?? 'unknown job'}`, error);
  });

  const shutdown = async signal => {
    console.log(`received ${signal}, shutting down worker`);
    await worker.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.once('SIGINT', () => {
    shutdown('SIGINT').catch(error => {
      console.error('error during worker shutdown', error);
      process.exit(1);
    });
  });

  process.once('SIGTERM', () => {
    shutdown('SIGTERM').catch(error => {
      console.error('error during worker shutdown', error);
      process.exit(1);
    });
  });

  return worker;
};

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    await startWorker();
  } catch (error) {
    console.error('failed to start worker', error);
    process.exit(1);
  }
}
