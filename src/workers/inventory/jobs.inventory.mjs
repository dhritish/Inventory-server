import mongoose from 'mongoose';
import * as inventoryJobServices from './jobServices.inventory.mjs';
import { promptGenerator } from '../helpers.mjs';
import { getGenAIClient } from '../../config/genai.mjs';

export const addItem = async data => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const categoryEmbeddingOfItem =
      await inventoryJobServices.getCategoryEmbeddingOfItem(data, session);
    if (categoryEmbeddingOfItem) {
      data.category = categoryEmbeddingOfItem.category;
      data.embedding = categoryEmbeddingOfItem.embedding;
    } else {
      const categories = await inventoryJobServices.getCategoryString();
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
        await inventoryJobServices.addCategory(result.category, session);
      }
      data.category = result.category;
      const emb = await inventoryJobServices.getEmbedding(
        `${data.name}, category: ${result.category}`,
      );
      data.embedding = [...emb.data];
    }
    await inventoryJobServices.addTotalOfItems(data, session);
    await inventoryJobServices.addItemsWithExpire(data, session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
