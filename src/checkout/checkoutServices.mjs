import { queue } from '../queue.mjs';
import { Cart } from '../cart/cartModels.mjs';
import { TotalOfItems } from '../inventory/inventoryModels.mjs';
import { Order } from './checkoutModels.mjs';
import mongoose from 'mongoose';

export const digitalCheckout = (data, total, qrcode, user) => {
  const sold_date = new Date();
  for (const itemdata of data) {
    itemdata.qr_id = qrcode.id;
    itemdata.sold_date = sold_date;
    itemdata.user = user;
  }
  return queue.add(
    'digital',
    { data, total },
    {
      jobId: `digital-${sold_date}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    },
  );
};

export const cashCheckout = (data, total, user) => {
  const sold_date = new Date();
  for (const itemdata of data) {
    itemdata.sold_date = sold_date;
    itemdata.user = user;
    itemdata.status = 'success';
  }
  return queue.add(
    'cash',
    { data, total },
    {
      jobId: `cash-${sold_date}`,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    },
  );
};

export const getCart = (user, session) => {
  return Cart.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(user),
      },
    },
    {
      $unwind: {
        path: '$items',
      },
    },
    {
      $lookup: {
        from: 'totalofitems',
        localField: 'items._id',
        foreignField: '_id',
        as: 'product',
      },
    },
    {
      $unwind: {
        path: '$product',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        _id: '$items._id',
        quantity: '$items.quantity',
        name: '$product.name',
        price: '$product.price',
      },
    },
  ]).session(session);
};

export const updateTotalOfItems = (cart, session) => {
  return TotalOfItems.bulkWrite(
    cart.map(item => ({
      updateOne: {
        filter: {
          _id: item._id,
          quantity: { $gte: item.quantity },
        },
        update: {
          $inc: { quantity: -item.quantity },
        },
      },
    })),
    { session },
  );
};

export const createOrderPOD = (cart, userId, location, session) => {
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  return Order.create(
    [
      {
        user: userId,
        items: cart,
        total,
        payment: 'POD',
        location,
      },
    ],
    {
      session,
    },
  );
};

export const createOrderPP = (cart, userId, location, session, orderId) => {
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  return Order.create(
    [
      {
        user: userId,
        items: cart,
        total,
        payment: 'pending',
        location,
        orderId,
      },
    ],
    {
      session,
    },
  );
};

export const clearCart = (user, session) => {
  return Cart.updateOne(
    {
      userId: new mongoose.Types.ObjectId(user),
    },
    {
      $set: {
        items: [],
        updatedAt: new Date(),
      },
    },
    {
      session,
    },
  );
};

export const revertIfUnpaid = orderId => {
  return queue.add(
    'revertIfUnpaid',
    { orderId },
    {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      delay: 10 * 60 * 1000,
    },
  );
};
