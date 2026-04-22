import { pipeline } from '@xenova/transformers';
import { Categories } from '../../analytics/analyticsModels.mjs';
import { TotalOfItems } from '../../inventory/inventoryModels.mjs';
import { ItemsWithExpire } from '../../inventory/inventoryModels.mjs';

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
  const categories = await Categories.find().select('category -_id').lean();
  const arr = categories.map(category => category.category);
  return arr.join(', ');
};

export const getCategoryEmbeddingOfItem = (data, session) => {
  return TotalOfItems.findOne({
    name: data.name,
  })
    .session(session)
    .select('category embedding -_id')
    .lean();
};

export const addTotalOfItems = (data, session) => {
  return TotalOfItems.updateOne(
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
  return ItemsWithExpire.updateOne(
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
