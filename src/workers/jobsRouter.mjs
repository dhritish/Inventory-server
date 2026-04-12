import * as jobs from './jobs.mjs';
import * as authJobs from './auth/jobs.auth.mjs';

export const processJob = job => {
  switch (job.name) {
    case 'digital': {
      return jobs.digitalCheckout(job.data.data);
    }

    case 'cash': {
      return jobs.cashCheckout(job.data.data, job.data.total);
    }

    case 'update_qr_id': {
      return jobs.updateQrId(job.data.qr_id, job.data.status, job.data.total);
    }

    case 'additem': {
      return jobs.addItem(job.data.body);
    }

    case 'send_notification': {
      return jobs.sendNotification(
        job.data.qr_id,
        job.data.status,
        job.data.total,
      );
    }

    case 'report': {
      return jobs.report();
    }

    case 'signup': {
      return authJobs.signup(job.data.body);
    }

    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};
