import mongoose from 'mongoose';
import * as orderServices from './orderServices.mjs';
import { array, z } from 'zod';

const orderSchema = z.object({
  user: z.string(),
});

const cancelOrderSchema = z.object({
  orderId: z.string(),
  _id: z.string(),
});

const updateOrderSchema = z.object({
  _id: z.string(),
  status: z.string(),
  location: z.array(z.number()).optional(),
  totalPrice: z.number().optional(),
  totalItems: z.number().optional(),
  payment: z.string().optional(),
});

const updateManyOrderSchema = z.object({
  _ids: array(z.string()),
  status: z.string(),
});

const getOrdersSchema = z.object({
  status: z.string(),
});

export const getNotDeliveredItems = async (request, response) => {
  const user = request.user;
  const result = orderSchema.safeParse({ user });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const orderedItems = await orderServices.getNotDeliveredItems(user);
  return response.status(200).json({ success: true, orderedItems });
};

export const getDeliveredItems = async (request, response) => {
  const user = request.user;
  const result = orderSchema.safeParse({ user });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const deliveredItems = await orderServices.getDeliveredItems(user);
  return response.status(200).json({ success: true, deliveredItems });
};

export const cancelOrder = async (request, response) => {
  const { orderId, _id } = request.body;
  const user = request.user;
  const result = cancelOrderSchema.safeParse({ orderId, _id });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    await orderServices.cancelOrder(orderId, _id, session);
    await session.commitTransaction();
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
  return response.status(200).json({ success: true });
};

export const getOrders = async (request, response) => {
  const { status } = request.query;
  const result = getOrdersSchema.safeParse({ status });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const order = await orderServices.getOrders(status);
  return response.status(200).json({ success: true, order });
};

export const updateOrder = async (request, response) => {
  const user = request.user;
  const { _id, status, location, totalPrice, totalItems, payment } =
    request.body;
  const result = updateOrderSchema.safeParse(request.body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  if (status === 'out for delivery') {
    await orderServices.updateOrderToOFD(
      _id,
      status,
      user,
      location,
      totalPrice,
      totalItems,
      payment,
    );
  } else {
    await orderServices.updateOrder(_id, status);
  }

  return response.status(200).json({ success: true });
};

export const updateManyOrder = async (request, response) => {
  const { _ids, status } = request.body;
  const result = updateManyOrderSchema.safeParse({ _ids, status });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  await orderServices.updateManyOrder(_ids, status);
  return response.status(200).json({ success: true });
};

export const getOrdersInfo = async (request, response) => {
  const { status } = request.query;
  const result = getOrdersSchema.safeParse({ status });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const info = await orderServices.getOrdersInfo(status);
  const orderInfo = info[0] ?? {
    totalOrders: 0,
    totalItems: 0,
    totalPrice: 0,
  };
  return response.status(200).json({ success: true, orderInfo });
};

export const getYourDelivery = async (request, response) => {
  const user = request.user;
  const yourDelivery = await orderServices.getYourDelivery(user);
  console.log(yourDelivery);
  return response.status(200).json({ success: true, yourDelivery });
};

export const calculatePath = async (request, response) => {
  const { _id, location } = request.body;
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const delivery = await orderServices.getDelivery(_id, session);
    if (!delivery) {
      throw new Error('Delivery not found');
    }
    const orderlocations = delivery.orders.map(order => [
      order.location[1],
      order.location[0],
    ]);
    orderlocations.forEach((location, index) => {
      orderlocations[index] = location.join(',');
    });
    const locationString = location.join(',') + ';' + orderlocations.join(';');
    const res = await (await orderServices.getGeometry(locationString)).json();
    delivery.geometry = res.trips[0].geometry;
    await delivery.save({ session });
    await session.commitTransaction();
    return response.status(200).json({ success: true, delivery });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
