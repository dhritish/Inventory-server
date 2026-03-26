import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  insertMany: vi.fn(),
  itemsWithExpireBulkWrite: vi.fn(),
  totalOfItemsBulkWrite: vi.fn(),
  categoryWiseMonthlySalesBulkWrite: vi.fn(),
  categoryWiseDailySalesBulkWrite: vi.fn(),
  individualItemMonthlySalesBulkWrite: vi.fn(),
  monthlySalesUpdateOne: vi.fn(),
  dailySalesUpdateOne: vi.fn(),
  totalOfItemsUpdateOne: vi.fn(),
  itemsWithExpireUpdateOne: vi.fn(),
  individualItemTransactionsUpdateMany: vi.fn(),
  transactionSave: vi.fn(),
  categorySave: vi.fn(),
  Transactions: vi.fn().mockImplementation(function Transactions(doc) {
    this.doc = doc;
    this.save = mockState.transactionSave;
  }),
  Categories: vi.fn().mockImplementation(function Categories(doc) {
    this.doc = doc;
    this.save = mockState.categorySave;
  }),
}));

vi.mock('../../src/models/checkoutModels.mjs', () => ({
  IndividualItemTransactions: {
    insertMany: mockState.insertMany,
    updateMany: mockState.individualItemTransactionsUpdateMany,
  },
}));

vi.mock('../../src/models/inventoryModels.mjs', () => ({
  ItemsWithExpire: {
    bulkWrite: mockState.itemsWithExpireBulkWrite,
    updateOne: mockState.itemsWithExpireUpdateOne,
  },
  TotalOfItems: {
    bulkWrite: mockState.totalOfItemsBulkWrite,
    updateOne: mockState.totalOfItemsUpdateOne,
  },
}));

vi.mock('../../src/models/analyticsModels.mjs', () => ({
  CategoryWiseMonthlySales: {
    bulkWrite: mockState.categoryWiseMonthlySalesBulkWrite,
  },
  CategoryWiseDailySales: {
    bulkWrite: mockState.categoryWiseDailySalesBulkWrite,
  },
  IndividualItemMonthlySales: {
    bulkWrite: mockState.individualItemMonthlySalesBulkWrite,
  },
  Transactions: mockState.Transactions,
  MonthlySales: {
    updateOne: mockState.monthlySalesUpdateOne,
  },
  DailySales: {
    updateOne: mockState.dailySalesUpdateOne,
  },
  Categories: mockState.Categories,
}));

vi.mock('../../src/models/authModels.mjs', () => ({
  DeviceToken: {
    find: vi.fn(),
  },
}));

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(),
}));

vi.mock('../../src/config/firebase.mjs', () => ({
  getFirebaseAdmin: vi.fn(),
}));

const jobServices = await import('../../src/workers/jobServices.mjs');

describe('jobServices update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('addIndividualItemTransaction inserts docs without _id', async () => {
    const session = { id: 's1' };
    const data = [
      { _id: '1', name: 'chips', quantity: 2 },
      { _id: '2', name: 'cola', quantity: 1 },
    ];

    await jobServices.addIndividualItemTransaction(data, session);

    expect(mockState.insertMany).toHaveBeenCalledWith(
      [
        { name: 'chips', quantity: 2 },
        { name: 'cola', quantity: 1 },
      ],
      { session },
    );
  });

  it('updateItemsWithExpire decrements matching expire batches', async () => {
    const session = { id: 's1' };
    const data = [{ name: 'milk', price: 30, expire: '2026-03-30', quantity: 2 }];

    await jobServices.updateItemsWithExpire(data, session);

    expect(mockState.itemsWithExpireBulkWrite).toHaveBeenCalledWith(
      [
        {
          updateOne: {
            filter: { name: 'milk', price: 30, expire: '2026-03-30' },
            update: { $inc: { quantity: -2 } },
          },
        },
      ],
      { session },
    );
  });

  it('updateTotalOfItems decrements aggregated inventory counts', async () => {
    const session = { id: 's1' };
    const data = [{ name: 'milk', price: 30, quantity: 2 }];

    await jobServices.updateTotalOfItems(data, session);

    expect(mockState.totalOfItemsBulkWrite).toHaveBeenCalledWith(
      [
        {
          updateOne: {
            filter: { name: 'milk', price: 30 },
            update: { $inc: { quantity: -2 } },
          },
        },
      ],
      { session },
    );
  });

  it('updateCategoryWiseMonthlySales upserts monthly totals by category', async () => {
    const session = { id: 's1' };
    const totals = [{ category: 'snacks', total: 120 }];

    await jobServices.updateCategoryWiseMonthlySales(totals, '2026-03', session);

    expect(mockState.categoryWiseMonthlySalesBulkWrite).toHaveBeenCalledWith(
      [
        {
          updateOne: {
            filter: { month: '2026-03', category: 'snacks' },
            update: { $inc: { total: 120 } },
            upsert: true,
          },
        },
      ],
      { session },
    );
  });

  it('updateCategoryWiseDailySales upserts daily totals by category', async () => {
    const session = { id: 's1' };
    const today = new Date('2026-03-26T00:00:00.000Z');
    const totals = [{ category: 'snacks', total: 120 }];

    await jobServices.updateCategoryWiseDailySales(totals, today, session);

    expect(mockState.categoryWiseDailySalesBulkWrite).toHaveBeenCalledWith(
      [
        {
          updateOne: {
            filter: { date: today, category: 'snacks' },
            update: { $inc: { total: 120 } },
            upsert: true,
          },
        },
      ],
      { session },
    );
  });

  it('updateIndividualItemMonthlySales upserts monthly quantity per item', async () => {
    const session = { id: 's1' };
    const data = [
      { name: 'chips', price: 20, category: 'snacks', quantity: 3 },
    ];

    await jobServices.updateIndividualItemMonthlySales(data, '2026-03', session);

    expect(mockState.individualItemMonthlySalesBulkWrite).toHaveBeenCalledWith(
      [
        {
          updateOne: {
            filter: {
              month: '2026-03',
              name: 'chips',
              price: 20,
              category: 'snacks',
            },
            update: {
              $inc: { quantity: 3 },
            },
            upsert: true,
          },
        },
      ],
      { session },
    );
  });

  it('addTransaction creates and saves a transaction document', async () => {
    const session = { id: 's1' };
    const date = new Date('2026-03-26T10:00:00.000Z');

    await jobServices.addTransaction(date, 500, session);

    expect(mockState.Transactions).toHaveBeenCalledWith({ date, total: 500 });
    expect(mockState.transactionSave).toHaveBeenCalledWith({ session });
  });

  it('updateMonthlySales increments the monthly total with upsert', async () => {
    const session = { id: 's1' };

    await jobServices.updateMonthlySales('2026-03', 500, session);

    expect(mockState.monthlySalesUpdateOne).toHaveBeenCalledWith(
      { month: '2026-03' },
      { $inc: { total: 500 } },
      { upsert: true, session },
    );
  });

  it('updateDailySales increments the daily total with upsert', async () => {
    const session = { id: 's1' };
    const today = new Date('2026-03-26T00:00:00.000Z');

    await jobServices.updateDailySales(today, 500, session);

    expect(mockState.dailySalesUpdateOne).toHaveBeenCalledWith(
      { date: today },
      { $inc: { total: 500 } },
      { upsert: true, session },
    );
  });

  it('addCategory creates and saves a category document', async () => {
    const session = { id: 's1' };

    await jobServices.addCategory('snacks', session);

    expect(mockState.Categories).toHaveBeenCalledWith({ category: 'snacks' });
    expect(mockState.categorySave).toHaveBeenCalledWith({ session });
  });

  it('updateIndividualItemTransaction updates all matching rows with the status', async () => {
    const session = { id: 's1' };

    await jobServices.updateIndividualItemTransaction('qr1', 'paid', session);

    expect(mockState.individualItemTransactionsUpdateMany).toHaveBeenCalledWith(
      { qr_id: 'qr1' },
      { $set: { status: 'paid' } },
      { session },
    );
  });

  it('addTotalOfItems upserts aggregate inventory by identifying fields', async () => {
    const session = { id: 's1' };
    const data = {
      barcode: '123',
      name: 'chips',
      price: 20,
      embedding: [0.1, 0.2],
      category: 'snacks',
      quantity: 5,
    };

    await jobServices.addTotalOfItems(data, session);

    expect(mockState.totalOfItemsUpdateOne).toHaveBeenCalledWith(
      {
        barcode: '123',
        name: 'chips',
        price: 20,
        embedding: [0.1, 0.2],
        category: 'snacks',
      },
      { $inc: { quantity: 5 } },
      { upsert: true, session },
    );
  });

  it('addItemsWithExpire upserts inventory batches including expire date', async () => {
    const session = { id: 's1' };
    const data = {
      barcode: '123',
      name: 'chips',
      price: 20,
      expire: '2026-03-30',
      embedding: [0.1, 0.2],
      category: 'snacks',
      quantity: 5,
    };

    await jobServices.addItemsWithExpire(data, session);

    expect(mockState.itemsWithExpireUpdateOne).toHaveBeenCalledWith(
      {
        barcode: '123',
        name: 'chips',
        price: 20,
        expire: '2026-03-30',
        embedding: [0.1, 0.2],
        category: 'snacks',
      },
      { $inc: { quantity: 5 } },
      { upsert: true, session },
    );
  });
});
