import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IndividualItemTransactions } from '../../src/checkout/checkoutModels.mjs';
import { getTrending } from '../../src/suggestion/suggestionServices.mjs';

vi.mock('../../src/checkout/checkoutModels.mjs', () => ({
  IndividualItemTransactions: {
    aggregate: vi.fn(),
  },
}));

describe('suggestion services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('return trending products', async () => {
    IndividualItemTransactions.aggregate.mockResolvedValue([
      {
        name: 'item1',
        price: 10,
        total: 100,
      },
      {
        name: 'item2',
        price: 20,
        total: 200,
      },
    ]);
    const trendingProducts = await getTrending(10);
    expect(IndividualItemTransactions.aggregate).toHaveBeenCalledWith([
      {
        $match: {
          status: 'success',
          sold_date: {
            $gte: expect.any(Date),
          },
        },
      },
      {
        $group: {
          _id: {
            name: '$name',
            price: '$price',
          },
          total: { $sum: '$quantity' },
        },
      },
      {
        $sort: {
          total: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          name: '$_id.name',
          price: '$_id.price',
          total: 1,
        },
      },
    ]);
    expect(trendingProducts).toEqual([
      {
        name: 'item1',
        price: 10,
        total: 100,
      },
      {
        name: 'item2',
        price: 20,
        total: 200,
      },
    ]);
  });
});
