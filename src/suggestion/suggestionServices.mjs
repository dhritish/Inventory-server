import { IndividualItemTransactions } from '../checkout/checkoutModels.mjs';

export function getTrending(limit) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 200);

  return IndividualItemTransactions.aggregate([
    {
      $match: {
        status: 'success',
        sold_date: {
          $gte: cutoffDate,
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
      $limit: limit,
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
}
