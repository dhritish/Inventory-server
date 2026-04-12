import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  Transactions: {
    find: vi.fn(),
  },
  MonthlySales: {
    find: vi.fn(),
  },
  DailySales: {
    findOne: vi.fn(),
  },
  Categories: {
    find: vi.fn(),
  },
  CategoryWiseMonthlySales: {
    find: vi.fn(),
  },
  CategoryWiseDailySales: {
    findOne: vi.fn(),
  },
}));

vi.mock('../../src/analytics/analyticsModels.mjs', () => ({
  Transactions: dbMocks.Transactions,
  MonthlySales: dbMocks.MonthlySales,
  DailySales: dbMocks.DailySales,
  Categories: dbMocks.Categories,
  CategoryWiseMonthlySales: dbMocks.CategoryWiseMonthlySales,
  CategoryWiseDailySales: dbMocks.CategoryWiseDailySales,
}));

const analyticsServices =
  await import('../../src/analytics/analyticsServices.mjs');

describe('analyticsServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRecentTransactions', async () => {
    const limit = 10;
    const skip = 0;
    const query = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    dbMocks.Transactions.find.mockReturnValue(query);
    await analyticsServices.getRecentTransactions(limit, skip);
    expect(dbMocks.Transactions.find).toHaveBeenCalled();
    expect(query.select).toHaveBeenCalledWith('date total');
    expect(query.sort).toHaveBeenCalledWith({ date: -1 });
    expect(query.skip).toHaveBeenCalledWith(skip);
    expect(query.limit).toHaveBeenCalledWith(limit);
  });

  it('getMonthlySales', async () => {
    const limit = 10;
    const query = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis([]),
      lean: vi.fn().mockResolvedValue([]),
    };
    dbMocks.MonthlySales.find.mockReturnValue(query);
    await analyticsServices.getMonthlySales(limit);
    expect(dbMocks.MonthlySales.find).toHaveBeenCalled();
    expect(query.select).toHaveBeenCalledWith('month total -_id');
    expect(query.sort).toHaveBeenCalledWith({ month: -1 });
    expect(query.limit).toHaveBeenCalledWith(limit);
    expect(query.lean).toHaveBeenCalled();
  });

  it('getDailySales', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({}),
    };
    dbMocks.DailySales.findOne.mockReturnValue(query);
    await analyticsServices.getDailySales();
    expect(dbMocks.DailySales.findOne).toHaveBeenCalledWith({
      date: expect.any(Date),
    });
    expect(query.select).toHaveBeenCalledWith('total');
    expect(query.lean).toHaveBeenCalled();
  });

  it('getCategories', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    };
    dbMocks.Categories.find.mockReturnValue(query);
    await analyticsServices.getCategories();
    expect(dbMocks.Categories.find).toHaveBeenCalled();
    expect(query.select).toHaveBeenCalledWith('category -_id');
    expect(query.lean).toHaveBeenCalled();
  });

  it('getCategoryWiseMonthlySales', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    };
    dbMocks.CategoryWiseMonthlySales.find.mockReturnValue(query);
    await analyticsServices.getCategoryWiseMonthlySales('category', 'limit');
    expect(dbMocks.CategoryWiseMonthlySales.find).toHaveBeenCalledWith({
      category: 'category',
    });
    expect(query.select).toHaveBeenCalledWith('month total -_id');
    expect(query.sort).toHaveBeenCalledWith({ month: -1 });
    expect(query.limit).toHaveBeenCalledWith('limit');
    expect(query.lean).toHaveBeenCalled();
  });

  it('getCategoryWiseDailySales', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({}),
    };
    dbMocks.CategoryWiseDailySales.findOne.mockReturnValue(query);
    await analyticsServices.getCategoryWiseDailySales('category');
    expect(dbMocks.CategoryWiseDailySales.findOne).toHaveBeenCalledWith({
      date: expect.any(Date),
      category: 'category',
    });
    expect(query.select).toHaveBeenCalledWith('total');
    expect(query.lean).toHaveBeenCalled();
  });
});
