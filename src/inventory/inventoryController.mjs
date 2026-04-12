import * as inventoryServices from './inventoryServices.mjs';
import { z } from 'zod';
import { getEmbedding } from '../workers/jobServices.mjs';

const addItemSchema = z.object({
  barcode: z.string().optional(),
  name: z.string(),
  price: z.coerce.number().positive(),
  quantity: z.coerce.number().positive(),
  expire: z.string().datetime({ offset: true }).optional(),
});

const getItemNameSchema = z.object({
  barcode: z.string(),
});

const getSearchedItemSchema = z.object({
  name: z.string().trim().min(1),
});

export const addItem = async (request, response) => {
  const { body } = request;
  const result = addItemSchema.safeParse(body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  await inventoryServices.addItem(result.data);
  return response.status(200).json({ success: true });
};

export const getItemName = async (request, response) => {
  const { query } = request;
  const result = getItemNameSchema.safeParse(query);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const itemName = await inventoryServices.getItemName(query.barcode);
  return response.status(200).json({ success: true, itemName });
};

export const getItemInformation = async (request, response) => {
  const { query } = request;
  const result = getItemNameSchema.safeParse(query);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const itemInformation = await inventoryServices.getItemInformation(
    query.barcode,
  );
  return response.status(200).json({ success: true, itemInformation });
};

export const getSearchedItem = async (request, response) => {
  const { query } = request;
  const result = getSearchedItemSchema.safeParse(query);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const emb = await getEmbedding(query.name);
  if (emb.data.length === 0) {
    return response
      .status(400)
      .json({ success: false, error: 'Embedding not found' });
  }
  const embedding = [...emb.data];
  const searchedItemList = await inventoryServices.getSearchedItem(embedding);
  return response.status(200).json({ success: true, searchedItemList });
};
