import IORedis from 'ioredis';
import { Queue } from 'bullmq';

export const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});
export const queue = new Queue('jobs', {
  connection,
  defaultJobOptions: { removeOnComplete: 1000, removeOnFail: 5000 },
});

export const registerRecurringJobs = async () => {
  await queue.add(
    'report',
    {},
    {
      jobId: `report-monthly ${new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString()}`,
      repeat: {
        pattern: '30 1 1 * *',
      },
    },
  );
};
