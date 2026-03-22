import { queue } from '../queue.mjs';
import * as inventorySchema from '../models/inventoryModels.mjs';

export const addItem = body => {
  return queue.add(
    'additem',
    { body },
    { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
  );
};

export const getItemName = barcode => {
  return inventorySchema.TotalOfItems.findOne({ barcode })
    .select('name -_id')
    .lean();
};

export const getItemInformation = barcode => {
  return inventorySchema.ItemsWithExpire.find({ barcode, quantity: { $gt: 0 } })
    .select('name price quantity expire category')
    .sort({ expire: 1 })
    .lean();
};

export const getSearchedItem = embedding => {
  return inventorySchema.ItemsWithExpire.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: embedding,
        numCandidates: 100,
        limit: 20,
      },
    },
    {
      $project: {
        name: 1,
        price: 1,
        quantity: 1,
        expire: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
    {
      $match: {
        score: { $gt: 0.7 },
        quantity: { $gt: 0 },
      },
    },
  ]);

  // return inventorySchema.ItemsWithExpire.find({
  //   name: { $regex: name, $options: 'i' },
  //   quantity: { $gt: 0 },
  // })
  //   .select('name price quantity expire ')
  //   .sort({ expire: 1 })
  //   .lean();
};
