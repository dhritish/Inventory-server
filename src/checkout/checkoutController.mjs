import * as checkoutServices from './checkoutServices.mjs';
import { z } from 'zod';
import { razorpayInstance } from '../config/razorpay.mjs';

const addIndividualItemTransactionsSchema = z.object({
  user: z.string(),
  body: z.object({
    data: z.array(
      z.object({
        _id: z.string(),
        barcode: z.string().optional(),
        name: z.string(),
        price: z.number(),
        expire: z.string().datetime({ offset: true }).nullable().optional(),
        quantity: z.number(),
        category: z.string(),
      }),
    ),
    total: z.number(),
  }),
});

export const digitalCheckout = async (request, response) => {
  const { body, user } = request;
  const result = addIndividualItemTransactionsSchema.safeParse({ user, body });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const { data, total } = body;
  const qrcode = await razorpayInstance.qrCode.create({
    type: 'upi_qr',
    name: 'Store_1',
    usage: 'single_use',
    fixed_amount: true,
    payment_amount: total * 100,
    description: 'For Store 1',
    notes: {
      purpose: 'Test UPI QR code notes',
    },
  });
  // console.log(qrcode);

  // const qrcode = await razorpayInstance.orders.create({
  //   amount: total * 100,
  //   currency: 'INR',
  //   receipt: 'receipt#1',
  // });
  await checkoutServices.digitalCheckout(data, total, qrcode, user);
  return response.status(200).json({ success: true, qrcode });
};

export const cashCheckout = async (request, response) => {
  const { body, user } = request;
  const result = addIndividualItemTransactionsSchema.safeParse({ user, body });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const { data, total } = body;
  await checkoutServices.cashCheckout(data, total, user);
  return response.status(200).json({ success: true });
};
