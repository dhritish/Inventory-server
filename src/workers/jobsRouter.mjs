import * as authJobs from './auth/jobs.auth.mjs';
import * as inventoryJobs from './inventory/jobs.inventory.mjs';
import * as analyticsJobs from './analytics/jobs.analytics.mjs';
import * as checkoutJobs from './checkout/jobs.checkout.mjs';
import * as cartJobs from './cart/jobs.cart.mjs';
import * as orderJobs from './orders/jobs.orders.mjs';

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

    case 'update-order': {
      return checkoutJobs.updateOrder(job.data.orderId, job.data.status);
    }

    case 'revertIfUnpaid': {
      return checkoutJobs.revertIfUnpaid(job.data.orderId);
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

    case 'addToCart': {
      return cartJobs.addToCart(job.data);
    }

    case 'removeFromCart': {
      return cartJobs.removeFromCart(job.data);
    }

    case 'decreaseFromCart': {
      return cartJobs.decreaseFromCart(job.data);
    }

    case 'updateManyOrder': {
      return orderJobs.updateManyOrder(job.data._ids, job.data.status);
    }

    case 'updateOrderToOFD': {
      return orderJobs.updateOrderToOFD(
        job.data._id,
        job.data.status,
        job.data.user,
        job.data.location,
        job.data.totalPrice,
        job.data.totalItems,
        job.data.payment,
      );
    }

    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
};
