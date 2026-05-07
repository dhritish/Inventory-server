import mongoose from 'mongoose';
import { Order } from '../checkout/checkoutModels.mjs';
import { AppError } from '../utils/helper.mjs';
import { queue } from '../queue.mjs';
import { DeliveryRoutes } from './orderModels.mjs';

export const getNotDeliveredItems = userId => {
  const user = new mongoose.Types.ObjectId(userId);

  return Order.aggregate([
    {
      $match: {
        user,
        isDelivered: false,
      },
    },
    {
      $unwind: '$items',
    },
    {
      $lookup: {
        from: 'totalofitems',
        localField: 'items._id',
        foreignField: '_id',
        as: 'itemInfo',
      },
    },
    {
      $unwind: '$itemInfo',
    },
    {
      $project: {
        orderId: '$_id',
        _id: '$itemInfo._id',
        name: '$itemInfo.name',
        price: '$itemInfo.price',
        quantity: '$items.quantity',
        stock: '$itemInfo.quantity',
        url: '$itemInfo.url',
        isDelivered: '$isDelivered',
        status: '$status',
      },
    },
  ]);
};

export const getDeliveredItems = userId => {
  const user = new mongoose.Types.ObjectId(userId);

  return Order.aggregate([
    {
      $match: {
        user,
        isDelivered: true,
      },
    },
    {
      $unwind: '$items',
    },
    {
      $lookup: {
        from: 'totalofitems',
        localField: 'items._id',
        foreignField: '_id',
        as: 'itemInfo',
      },
    },
    {
      $unwind: '$itemInfo',
    },
    {
      $project: {
        orderId: '$_id',
        _id: '$itemInfo._id',
        name: '$itemInfo.name',
        price: '$itemInfo.price',
        quantity: '$items.quantity',
        stock: '$itemInfo.quantity',
        url: '$itemInfo.url',
        isDelivered: '$isDelivered',
        status: '$status',
      },
    },
  ]);
};

export const cancelOrder = async (orderId, _id, session) => {
  const order = await Order.findById(orderId).session(session);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const itemIndex = order.items.findIndex(item => item._id.toString() === _id);
  if (itemIndex === -1) {
    throw new AppError('Item not found in the order', 404);
  }
  order.total =
    order.total -
    order.items[itemIndex].price * order.items[itemIndex].quantity;
  order.items.splice(itemIndex, 1);
  if (order.items.length === 0) {
    order.status = 'cancelled';
  }
  order.modifiedAt = new Date();
  await order.save({ session });
};

export const getOrders = status => {
  return Order.find({
    status,
    payment: { $in: ['POD', 'paid'] },
  })
    .select('_id user items total payment location')
    .lean();
};

export const getOrdersInfo = status => {
  return Order.aggregate([
    {
      $match: {
        status,
        payment: { $in: ['POD', 'paid'] },
      },
    },
    {
      $unwind: '$items',
    },
    {
      $group: {
        _id: null,
        totalOrders: { $addToSet: '$_id' },
        totalItems: { $sum: '$items.quantity' },
        totalPrice: {
          $sum: {
            $multiply: ['$items.price', '$items.quantity'],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalOrders: { $size: '$totalOrders' },
        totalItems: 1,
        totalPrice: 1,
      },
    },
  ]);
};

export const updateOrder = (_id, status) => {
  return Order.updateOne(
    {
      _id,
    },
    {
      $set: {
        status,
      },
    },
    {
      runValidators: true,
    },
  );
};

export const updateOrderToOFD = (
  _id,
  status,
  user,
  location,
  totalPrice,
  totalItems,
  payment,
) => {
  return queue.add(
    'updateOrderToOFD',
    {
      _id,
      status,
      user,
      location,
      totalPrice,
      totalItems,
      payment,
    },
    { attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
  );
};

export const updateManyOrder = (_ids, status) => {
  return queue.add(
    'updateManyOrder',
    {
      _ids,
      status,
    },
    { attempts: 5, backoff: { type: 'exponential', delay: 1000 } },
  );
};

export const getYourDelivery = userId => {
  return DeliveryRoutes.find({
    agentId: userId,
    status: { $in: ['pending', 'on route'] },
  }).select('_id totalPrice totalItems status orders geometry');
};

export const getDelivery = (_id, session) => {
  return DeliveryRoutes.findOne({
    _id,
    status: { $in: ['pending', 'on route'] },
  }).session(session);
};

export const getGeometry = locationString => {
  return fetch(
    `https://router.project-osrm.org/trip/v1/driving/${locationString}?source=first&roundtrip=true&overview=full&geometries=polyline6`,
  );
};
