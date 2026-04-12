import * as analyticsServices from './analyticsServices.mjs';
import { z } from 'zod';

const getRecentTransactionsSchema = z.object({
  limit: z.coerce.number().min(1).max(10),
  skip: z.coerce.number().min(0),
});

const getGraphDataSchema = z.object({
  limit: z.coerce.number().min(1).max(10),
});

const getCategoryWiseSalesSchema = z.object({
  category: z.string(),
  limit: z.coerce.number().min(1).max(10),
});

export const getRecentTransactions = async (request, response) => {
  const { query } = request;
  const result = getRecentTransactionsSchema.safeParse(query);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const recentTransactions = await analyticsServices.getRecentTransactions(
    result.data.limit,
    result.data.skip,
  );
  return response.status(200).json({ success: true, recentTransactions });
};

export const getGraphData = async (request, response) => {
  const { query } = request;
  const result = getGraphDataSchema.safeParse(query);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const [monthlySales, todaySales] = await Promise.all([
    analyticsServices.getMonthlySales(result.data.limit),
    analyticsServices.getDailySales(),
  ]);
  return response.status(200).json({ success: true, monthlySales, todaySales });
};

export const getCategories = async (request, response) => {
  const categories = await analyticsServices.getCategories();
  return response.status(200).json({ success: true, categories });
};

export const getCategoryWiseSales = async (request, response) => {
  const { query } = request;
  const result = getCategoryWiseSalesSchema.safeParse(query);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const [categoryMonthlySales, categoryTodaySales] = await Promise.all([
    analyticsServices.getCategoryWiseMonthlySales(
      result.data.category,
      result.data.limit,
    ),
    analyticsServices.getCategoryWiseDailySales(result.data.category),
  ]);
  return response
    .status(200)
    .json({ success: true, categoryMonthlySales, categoryTodaySales });
};

export const getReport = async (request, response) => {
  await analyticsServices.getReport();
  return response.status(200).json({ success: true });
};
