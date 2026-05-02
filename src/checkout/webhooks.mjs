import express from 'express';
import crypto from 'crypto';
import { queue } from '../queue.mjs';

const router = express.Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    const body = request.body;
    const signaturerecieved = request.headers['x-razorpay-signature'];
    const webhooksecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const realsignature = crypto
      .createHmac('sha256', webhooksecret)
      .update(body)
      .digest('hex');
    if (signaturerecieved === realsignature) {
      const payload = JSON.parse(body.toString('utf8'));
      const payment = payload.payload.payment.entity;

      if (payment?.order_id?.startsWith('order_')) {
        await queue.add(
          'update-order',
          {
            orderId: payment.order_id,
            status: payment.captured ? 'paid' : 'failed',
            total: payment.amount / 100,
          },
          {
            jobId: `update-order-${payment.order_id}`,
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );
      } else if (payment?.order_id?.startsWith('qr_')) {
        await queue.add(
          'update_qr_id',
          {
            qr_id: payment.order_id,
            status: payment.captured ? 'success' : 'failed',
            total: payment.amount / 100,
          },
          {
            jobId: `update_qr_id-${payment.order_id}`,
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );

        await queue.add(
          'send_notification',
          {
            qr_id: payment.order_id,
            status: payment.captured ? 'success' : 'failed',
            total: payment.amount / 100,
          },
          {
            jobId: `send_notification-${payment.order_id}`,
            attempts: 5,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );
      }

      response.status(200).json({ success: true });
    } else {
      response.status(400).json({ success: false });
    }
  },
);

export default router;
