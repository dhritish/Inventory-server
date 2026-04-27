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
      $lookup: {
        from: 'totalofitems',
        let: {
          name: '$_id.name',
          price: '$_id.price',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$name', '$$name'] },
                  { $eq: ['$price', '$$price'] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              quantity: 1,
              url: 1,
            },
          },
        ],
        as: 'product',
      },
    },
    {
      $unwind: {
        path: '$product',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        name: '$_id.name',
        price: '$_id.price',
        url: '$product.url',
        stock: '$product.quantity',
        _id: '$product._id',
        total: 1,
      },
    },
  ]);
}
