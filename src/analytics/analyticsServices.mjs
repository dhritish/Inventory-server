import * as analyticsSchema from './analyticsModels.mjs';
import { queue } from '../queue.mjs';

export const getRecentTransactions = (limit, skip) => {
  return analyticsSchema.Transactions.find()
    .select('date total')
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);
};

export const getMonthlySales = limit => {
  return analyticsSchema.MonthlySales.find()
    .select('month total -_id')
    .sort({ month: -1 })
    .limit(limit)
    .lean();
};

export const getDailySales = () => {
  const date = new Date();
  const newdate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  return analyticsSchema.DailySales.findOne({ date: newdate })
    .select('total')
    .lean();
};

export const getCategories = () => {
  return analyticsSchema.Categories.find().select('category -_id').lean();
};

export const getCategoryWiseMonthlySales = (category, limit) => {
  return analyticsSchema.CategoryWiseMonthlySales.find({
    category,
  })
    .select('month total -_id')
    .sort({ month: -1 })
    .limit(limit)
    .lean();
};

export const getCategoryWiseDailySales = category => {
  const date = new Date();
  const newdate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  return analyticsSchema.CategoryWiseDailySales.findOne({
    date: newdate,
    category,
  })
    .select('total')
    .lean();
};

export const getReport = async () => {
  return queue.add(
    'report',
    {},
    {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  );
};
