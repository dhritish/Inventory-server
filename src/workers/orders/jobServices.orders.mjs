import { Order } from '../../checkout/checkoutModels.mjs';
import { DeliveryRoutes } from '../../orders/orderModels.mjs';

export const updateManyOrder = (_ids, status) => {
  return Order.bulkWrite(
    _ids.map(id => ({
      updateOne: {
        filter: {
          _id: id,
        },
        update: {
          $set: {
            status,
          },
        },
      },
    })),
  );
};

export const updateOrderToOFD = (_id, status, user, session) => {
  return Order.updateOne(
    {
      _id,
    },
    {
      $set: {
        status,
        agentId: user,
      },
    },
    {
      runValidators: true,
      session,
    },
  );
};

export const updateOrderInDeliveryRoute = (
  _id,
  user,
  session,
  location,
  totalPrice,
  totalItems,
  payment,
) => {
  return DeliveryRoutes.updateOne(
    {
      agentId: user,
      status: 'pending',
    },
    {
      $push: {
        orders: {
          orderId: _id,
          location,
          payment,
        },
      },
      $inc: {
        totalPrice,
        totalItems,
      },
    },
    {
      runValidators: true,
      session,
      upsert: true,
    },
  );
};
