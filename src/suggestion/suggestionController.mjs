import z, { coerce } from 'zod';
import * as suggestionServices from './suggestionServices.mjs';

const getTrendingSchema = z.object({
  limit: coerce.number().max(10),
});

export async function getTrending(request, response) {
  const { limit } = request.query;
  const result = getTrendingSchema.safeParse({ limit });
  if (result.success === false) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const trendingProducts = await suggestionServices.getTrending(
    result.data.limit,
  );
  return response.status(200).json({ success: true, trendingProducts });
}
