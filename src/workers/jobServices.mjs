import * as checkoutModels from '../models/checkoutModels.mjs';
import * as inventoryModels from '../models/inventoryModels.mjs';
import * as analyticsModels from '../models/analyticsModels.mjs';
import * as authModels from '../models/authModels.mjs';
import { pipeline } from '@xenova/transformers';
import { getFirebaseAdmin } from '../config/firebase.mjs';

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

export const addCategory = (category, session) => {
  const newCategory = new analyticsModels.Categories({ category });
  return newCategory.save({ session });
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

export const getIndividualItemTransaction = (qr_id, session) => {
  return checkoutModels.IndividualItemTransactions.find({ qr_id })
    .session(session)
    .select('name price quantity expire sold_date category -_id')
    .lean();
};

export const updateIndividualItemTransaction = (qr_id, status, session) => {
  return checkoutModels.IndividualItemTransactions.updateMany(
    { qr_id },
    { $set: { status: status } },
    { session },
  );
};

export const addTotalOfItems = (data, session) => {
  return inventoryModels.TotalOfItems.updateOne(
    {
      barcode: data.barcode,
      name: data.name,
      price: data.price,
      embedding: data.embedding,
      category: data.category,
    },
    { $inc: { quantity: data.quantity } },
    { upsert: true, session },
  );
};

export const addItemsWithExpire = (data, session) => {
  return inventoryModels.ItemsWithExpire.updateOne(
    {
      barcode: data.barcode,
      name: data.name,
      price: data.price,
      expire: data.expire,
      embedding: data.embedding,
      category: data.category,
    },
    { $inc: { quantity: data.quantity } },
    { upsert: true, session },
  );
};

export const getEmbedding = async name => {
  const embedder = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
  );
  return await embedder(name, {
    pooling: 'mean',
    normalize: true,
  });
};

export const getCategoryString = async () => {
  const categories = await analyticsModels.Categories.find()
    .select('category -_id')
    .lean();
  const arr = categories.map(category => category.category);
  return arr.join(', ');
};

export const getCategoryEmbeddingOfItem = (data, session) => {
  return inventoryModels.TotalOfItems.findOne({
    name: data.name,
  })
    .session(session)
    .select('category embedding -_id')
    .lean();
};
