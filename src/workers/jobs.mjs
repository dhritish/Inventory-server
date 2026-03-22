import * as jobServices from './jobServices.mjs';
import mongoose from 'mongoose';
import { getCategoryWiseTotal, getMonth, getToday } from '../utils/helper.mjs';
import { GoogleGenAI } from '@google/genai';
import { promptGenerator } from './helpers.mjs';

let genai;

const getGenAIClient = () => {
  if (genai) {
    return genai;
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is required to categorize inventory items.',
    );
  }

  genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return genai;
};

export const digitalCheckout = async data => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    await jobServices.addIndividualItemTransaction(data, session);
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
    await jobServices.addIndividualItemTransaction(data, session);
    await jobServices.addTransaction(date, total, session);
    await jobServices.updateMonthlySales(month, total, session);
    await jobServices.updateDailySales(today, total, session);
    await jobServices.updateCategoryWiseDailySales(
      categoryWiseTotal,
      today,
      session,
    );
    await jobServices.updateCategoryWiseMonthlySales(
      categoryWiseTotal,
      month,
      session,
    );
    await jobServices.updateItemsWithExpire(data, session);
    await jobServices.updateTotalOfItems(data, session);
    await jobServices.updateIndividualItemMonthlySales(data, month, session);

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
      const data = await jobServices.getIndividualItemTransaction(
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
      await jobServices.updateIndividualItemTransaction(qr_id, status, session);
      await jobServices.addTransaction(date, total, session);
      await jobServices.updateMonthlySales(month, total, session);
      await jobServices.updateDailySales(today, total, session);
      await jobServices.updateCategoryWiseDailySales(
        categoryWiseTotal,
        today,
        session,
      );
      await jobServices.updateCategoryWiseMonthlySales(
        categoryWiseTotal,
        month,
        session,
      );
      await jobServices.updateItemsWithExpire(data, session);
      await jobServices.updateTotalOfItems(data, session);
      await jobServices.updateIndividualItemMonthlySales(data, month, session);
    } else {
      await jobServices.updateIndividualItemTransaction(qr_id, status, session);
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
      await jobServices.getCategoryEmbeddingOfItem(data, session);
    if (categoryEmbeddingOfItem) {
      data.category = categoryEmbeddingOfItem.category;
      data.embedding = categoryEmbeddingOfItem.embedding;
    } else {
      const categories = await jobServices.getCategoryString();
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
        await jobServices.addCategory(result.category, session);
      }
      data.category = result.category;
      const emb = await jobServices.getEmbedding(
        `${data.name}, category: ${result.category}`,
      );
      data.embedding = [...emb.data];
    }
    await jobServices.addTotalOfItems(data, session);
    await jobServices.addItemsWithExpire(data, session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const sendNotification = async (qr_id, status, total) => {
  await jobServices.sendNotification(qr_id, status, total);
};
