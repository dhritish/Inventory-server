import * as checkoutServices from './checkoutServices.mjs';
import { z } from 'zod';
import { razorpayInstance } from '../config/razorpay.mjs';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';

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

const DeliverySchema = z.object({
  location: z.array(z.number()).length(2),
  user: z.string(),
});

const badRequestError = message =>
  Object.assign(new Error(message), { statusCode: 400 });

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

export const payOnDelivery = async (request, response) => {
  const { body, user } = request;
  const { location } = body;
  const result = DeliverySchema.safeParse({ location, user });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }

  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const cart = await checkoutServices.getCart(user, session);
    if (!cart.length) {
      throw badRequestError('Cart not found');
    }
    const updated = await checkoutServices.updateTotalOfItems(cart, session);
    if (updated.modifiedCount !== cart.length) {
      throw badRequestError('Not enough items in stock');
    }
    await checkoutServices.createOrderPOD(cart, user, location, session);
    await checkoutServices.clearCart(user, session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
  return response.status(200).json({ success: true });
};

export const prePayment = async (request, response) => {
  const { body, user } = request;
  const { location } = body;
  const result = DeliverySchema.safeParse({ location, user });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const cart = await checkoutServices.getCart(user, session);
    if (!cart.length) {
      throw badRequestError('Cart not found');
    }
    const updated = await checkoutServices.updateTotalOfItems(cart, session);
    if (updated.modifiedCount !== cart.length) {
      throw badRequestError('Not enough items in stock');
    }
    const order = await razorpayInstance.orders.create({
      amount:
        cart.reduce((acc, item) => acc + item.price * item.quantity, 0) * 100,
      currency: 'INR',
      receipt: 'receipt#1',
    });
    await checkoutServices.createOrderPP(
      cart,
      user,
      location,
      session,
      order.id,
    );
    await checkoutServices.revertIfUnpaid(order.id);
    await session.commitTransaction();
    return response.status(200).json({ success: true, orderId: order.id });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
