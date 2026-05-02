import * as checkoutModels from '../../checkout/checkoutModels.mjs';
import * as inventoryModels from '../../inventory/inventoryModels.mjs';
import * as analyticsModels from '../../analytics/analyticsModels.mjs';
import { getFirebaseAdmin } from '../../config/firebase.mjs';
import mongoose from 'mongoose';
import { Cart } from '../../cart/cartModels.mjs';

export const addIndividualItemTransaction = (data, session) => {
  const docs = data.map(({ _id, ...itemdata }) => itemdata);
  return checkoutModels.IndividualItemTransactions.insertMany(docs, {
    session,
  });
};

export const updateItemsWithExpire = (data, session) => {
  return inventoryModels.ItemsWithExpire.bulkWrite(
    data.map(itemdata => ({
      updateOne: {
        filter: {
          name: itemdata.name,
          price: itemdata.price,
          expire: itemdata.expire,
        },
        update: { $inc: { quantity: -itemdata.quantity } },
      },
    })),
    { session },
  );
};

export const updateTotalOfItems = (data, session) => {
  return inventoryModels.TotalOfItems.bulkWrite(
    data.map(itemdata => ({
      updateOne: {
        filter: {
          name: itemdata.name,
          price: itemdata.price,
        },
        update: { $inc: { quantity: -itemdata.quantity } },
      },
    })),
    { session },
  );
};

export const updateCategoryWiseMonthlySales = (
  categoryWiseTotal,
  month,
  session,
) => {
  return analyticsModels.CategoryWiseMonthlySales.bulkWrite(
    categoryWiseTotal.map(itemdata => ({
      updateOne: {
        filter: {
          month,
          category: itemdata.category,
        },
        update: { $inc: { total: itemdata.total } },
        upsert: true,
      },
    })),
    { session },
  );
};

export const updateCategoryWiseDailySales = (
  categoryWiseTotal,
  today,
  session,
) => {
  return analyticsModels.CategoryWiseDailySales.bulkWrite(
    categoryWiseTotal.map(itemdata => ({
      updateOne: {
        filter: {
          date: today,
          category: itemdata.category,
        },
        update: { $inc: { total: itemdata.total } },
        upsert: true,
      },
    })),
    { session },
  );
};

export const updateIndividualItemMonthlySales = (data, month, session) => {
  return analyticsModels.IndividualItemMonthlySales.bulkWrite(
    data.map(itemdata => ({
      updateOne: {
        filter: {
          month,
          name: itemdata.name,
          price: itemdata.price,
          category: itemdata.category,
        },
        update: {
          $inc: { quantity: itemdata.quantity },
        },
        upsert: true,
      },
    })),
    { session },
  );
};

export const addTransaction = (date, total, session) => {
  const newTransaction = new analyticsModels.Transactions({ date, total });
  return newTransaction.save({ session });
};

export const updateMonthlySales = (month, total, session) => {
  return analyticsModels.MonthlySales.updateOne(
    { month },
    { $inc: { total: total } },
    { upsert: true, session },
  );
};

export const updateDailySales = (today, total, session) => {
  return analyticsModels.DailySales.updateOne(
    { date: today },
    { $inc: { total: total } },
    { upsert: true, session },
  );
};

export const updateIndividualItemTransaction = (qr_id, status, session) => {
  return checkoutModels.IndividualItemTransactions.updateMany(
    { qr_id },
    { $set: { status: status } },
    { session },
  );
};

export const getIndividualItemTransaction = (qr_id, session) => {
  return checkoutModels.IndividualItemTransactions.find({ qr_id })
    .session(session)
    .select('name price quantity expire sold_date category -_id')
    .lean();
};

export const getUserFromIndividualItemTransaction = qr_id => {
  return checkoutModels.IndividualItemTransactions.findOne({ qr_id })
    .select('user -_id')
    .lean();
};

export const getDeviceToken = user => {
  return authModels.DeviceToken.find({ user })
    .select('devicetoken -_id')
    .lean();
};

export const sendNotification = async (qr_id, status, total) => {
  const admin = getFirebaseAdmin();

  const user = await getUserFromIndividualItemTransaction(qr_id);
  if (!user) {
    return;
  }
  const res_devicetokens = await getDeviceToken(user.user);
  if (res_devicetokens.length === 0) {
    return;
  }
  const devicetokens = res_devicetokens.map(
    devicetoken => devicetoken.devicetoken,
  );
  const message = {
    tokens: devicetokens,
    notification: {
      title: `Payment ${status}`,
      body: String(total),
    },
    data: {
      title: `Payment ${status}`,
      body: String(total),
    },
  };
  return await admin.messaging().sendEachForMulticast(message);
};

export const updateOrder = (orderId, status, session) => {
  return checkoutModels.Order.findOneAndUpdate(
    { orderId },
    { $set: { payment: status } },
    { new: true, session },
  )
    .select('user items -_id ')
    .lean();
};

export const clearCart = (userId, session) => {
  return Cart.updateOne(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $set: { items: [], updatedAt: new Date() } },
    { session },
  );
};

export const getOrder = (orderId, session) => {
  return checkoutModels.Order.findOne({ orderId })
    .session(session)
    .select('items user payment -_id')
    .lean();
};

export const addTotalOfItems = (items, session) => {
  return inventoryModels.TotalOfItems.bulkWrite(
    items.map(item => ({
      updateOne: {
        filter: {
          name: item.name,
          price: item.price,
        },
        update: { $inc: { quantity: item.quantity } },
      },
    })),
    { session },
  );
};
