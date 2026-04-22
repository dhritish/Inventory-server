import mongoose from 'mongoose';
import {
  getCategoryWiseTotal,
  getMonth,
  getToday,
} from '../../utils/helper.mjs';
import * as checkoutJobServices from './jobServices.checkout.mjs';

export const digitalCheckout = async data => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await checkoutJobServices.addIndividualItemTransaction(data, session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const cashCheckout = async (data, total) => {
  const date = data[0].sold_date;
  const month = getMonth(date);
  const today = getToday(date);
  const categoryWiseTotal = getCategoryWiseTotal(data);
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await checkoutJobServices.addIndividualItemTransaction(data, session);
    await checkoutJobServices.addTransaction(date, total, session);
    await checkoutJobServices.updateMonthlySales(month, total, session);
    await checkoutJobServices.updateDailySales(today, total, session);
    await checkoutJobServices.updateCategoryWiseDailySales(
      categoryWiseTotal,
      today,
      session,
    );
    await checkoutJobServices.updateCategoryWiseMonthlySales(
      categoryWiseTotal,
      month,
      session,
    );
    await checkoutJobServices.updateItemsWithExpire(data, session);
    await checkoutJobServices.updateTotalOfItems(data, session);
    await checkoutJobServices.updateIndividualItemMonthlySales(
      data,
      month,
      session,
    );

    await session.commitTransaction();
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateQrId = async (qr_id, status, total) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    if (status === 'success') {
      const data = await checkoutJobServices.getIndividualItemTransaction(
        qr_id,
        session,
      );
      if (data.length === 0) {
        await session.abortTransaction();
        return;
      }
      const date = data[0].sold_date;
      const month = getMonth(date);
      const today = getToday(date);
      const categoryWiseTotal = getCategoryWiseTotal(data);
      await checkoutJobServices.updateIndividualItemTransaction(
        qr_id,
        status,
        session,
      );
      await checkoutJobServices.addTransaction(date, total, session);
      await checkoutJobServices.updateMonthlySales(month, total, session);
      await checkoutJobServices.updateDailySales(today, total, session);
      await checkoutJobServices.updateCategoryWiseDailySales(
        categoryWiseTotal,
        today,
        session,
      );
      await checkoutJobServices.updateCategoryWiseMonthlySales(
        categoryWiseTotal,
        month,
        session,
      );
      await checkoutJobServices.updateItemsWithExpire(data, session);
      await checkoutJobServices.updateTotalOfItems(data, session);
      await checkoutJobServices.updateIndividualItemMonthlySales(
        data,
        month,
        session,
      );
    } else {
      await checkoutJobServices.updateIndividualItemTransaction(
        qr_id,
        status,
        session,
      );
    }
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const sendNotification = async (qr_id, status, total) => {
  await checkoutJobServices.sendNotification(qr_id, status, total);
};
