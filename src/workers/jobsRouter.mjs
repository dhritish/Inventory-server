import * as authJobs from './auth/jobs.auth.mjs';
import * as inventoryJobs from './inventory/jobs.inventory.mjs';
import * as analyticsJobs from './analytics/jobs.analytics.mjs';
import * as checkoutJobs from './checkout/jobs.checkout.mjs';

export const processJob = job => {
  switch (job.name) {
    case 'digital': {
      return checkoutJobs.digitalCheckout(job.data.data);
    }

    case 'cash': {
      return checkoutJobs.cashCheckout(job.data.data, job.data.total);
    }

    case 'update_qr_id': {
      return checkoutJobs.updateQrId(
        job.data.qr_id,
        job.data.status,
        job.data.total,
      );
    }

    case 'additem': {
      return inventoryJobs.addItem(job.data.body);
    }

    case 'send_notification': {
      return checkoutJobs.sendNotification(
        job.data.qr_id,
        job.data.status,
        job.data.total,
      );
    }

    case 'report': {
      return analyticsJobs.report();
    }

    case 'signup': {
      return authJobs.signup(job.data.body);
    }

    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};
