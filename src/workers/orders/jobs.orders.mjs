import mongoose from 'mongoose';
import * as ordersServices from './jobServices.orders.mjs';

export const updateManyOrder = async (_ids, status) => {
  await ordersServices.updateManyOrder(_ids, status);
};

export const updateOrderToOFD = async (
  _id,
  status,
  user,
  location,
  totalPrice,
  totalItems,
  payment,
) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();
    await ordersServices.updateOrderToOFD(_id, status, user, session);
    await ordersServices.updateOrderInDeliveryRoute(
      _id,
      user,
      session,
      location,
      totalPrice,
      totalItems,
      payment,
    );
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
