import * as jobs from './jobs.mjs';

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

    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};
