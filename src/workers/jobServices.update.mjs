import * as checkoutModels from '../checkout/checkoutModels.mjs';
import * as inventoryModels from '../inventory/inventoryModels.mjs';
import * as analyticsModels from '../analytics/analyticsModels.mjs';

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
