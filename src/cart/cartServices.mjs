import { queue } from '../queue.mjs';
import { Cart } from './cartModels.mjs';
import mongoose from 'mongoose';

export function addToCart(product, userId) {
  return queue.add(
    'addToCart',
    { product, userId },
    { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
  );
}

export function removeFromCart(product, userId) {
  return queue.add(
    'removeFromCart',
    { product, userId },
    { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
  );
}

export function decreseFromCart(product, userId) {
  return queue.add(
    'decreaseFromCart',
    { product, userId },
    { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
  );
}

export function getCart(userId) {
  const cartUserId = new mongoose.Types.ObjectId(userId);

  return Cart.aggregate([
    {
      $match: {
        userId: cartUserId,
      },
    },
    {
      $unwind: {
        path: '$items',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        _id: '$items._id',
        quantity: '$items.quantity',
      },
    },
    {
      $lookup: {
        from: 'totalofitems',
        localField: '_id',
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
        _id: 1,
        quantity: 1,
        name: '$product.name',
        price: '$product.price',
        url: '$product.url',
        stock: '$product.quantity',
      },
    },
  ]);
}
