import * as jobServicesGet from './jobServices.get.mjs';
import * as jobServicesUpdate from './jobServices.update.mjs';
import mongoose from 'mongoose';
import { getCategoryWiseTotal, getMonth, getToday } from '../utils/helper.mjs';
import { promptGenerator } from './helpers.mjs';
import { getGenAIClient } from '../config/genai.mjs';

export const digitalCheckout = async data => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await jobServicesUpdate.addIndividualItemTransaction(data, session);
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
    await jobServicesUpdate.addIndividualItemTransaction(data, session);
    await jobServicesUpdate.addTransaction(date, total, session);
    await jobServicesUpdate.updateMonthlySales(month, total, session);
    await jobServicesUpdate.updateDailySales(today, total, session);
    await jobServicesUpdate.updateCategoryWiseDailySales(
      categoryWiseTotal,
      today,
      session,
    );
    await jobServicesUpdate.updateCategoryWiseMonthlySales(
      categoryWiseTotal,
      month,
      session,
    );
    await jobServicesUpdate.updateItemsWithExpire(data, session);
    await jobServicesUpdate.updateTotalOfItems(data, session);
    await jobServicesUpdate.updateIndividualItemMonthlySales(
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
      const data = await jobServicesGet.getIndividualItemTransaction(
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
      await jobServicesUpdate.updateIndividualItemTransaction(
        qr_id,
        status,
        session,
      );
      await jobServicesUpdate.addTransaction(date, total, session);
      await jobServicesUpdate.updateMonthlySales(month, total, session);
      await jobServicesUpdate.updateDailySales(today, total, session);
      await jobServicesUpdate.updateCategoryWiseDailySales(
        categoryWiseTotal,
        today,
        session,
      );
      await jobServicesUpdate.updateCategoryWiseMonthlySales(
        categoryWiseTotal,
        month,
        session,
      );
      await jobServicesUpdate.updateItemsWithExpire(data, session);
      await jobServicesUpdate.updateTotalOfItems(data, session);
      await jobServicesUpdate.updateIndividualItemMonthlySales(
        data,
        month,
        session,
      );
    } else {
      await jobServicesUpdate.updateIndividualItemTransaction(
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

export const addItem = async data => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const categoryEmbeddingOfItem =
      await jobServicesGet.getCategoryEmbeddingOfItem(data, session);
    if (categoryEmbeddingOfItem) {
      data.category = categoryEmbeddingOfItem.category;
      data.embedding = categoryEmbeddingOfItem.embedding;
    } else {
      const categories = await jobServicesGet.getCategoryString();
      const prompt = promptGenerator(categories, data.name);
      const genaiClient = getGenAIClient();
      const res = await genaiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
        temperature: 0.2,
      });
      const result = JSON.parse(res.candidates[0].content.parts[0].text);
      console.log(result);
      if (result.newCategorySuggested) {
        await jobServicesUpdate.addCategory(result.category, session);
      }
      data.category = result.category;
      const emb = await jobServicesGet.getEmbedding(
        `${data.name}, category: ${result.category}`,
      );
      data.embedding = [...emb.data];
    }
    await jobServicesUpdate.addTotalOfItems(data, session);
    await jobServicesUpdate.addItemsWithExpire(data, session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const sendNotification = async (qr_id, status, total) => {
  await jobServicesGet.sendNotification(qr_id, status, total);
};

export const report = async () => {
  await jobServicesGet.getReport();
};
