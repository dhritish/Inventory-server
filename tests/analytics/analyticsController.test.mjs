import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResponse } from '../helpers/httpTestUtils.mjs';

const analyticsServicesMocks = vi.hoisted(() => ({
  getRecentTransactions: vi.fn(),
  getMonthlySales: vi.fn(),
  getDailySales: vi.fn(),
  getCategories: vi.fn(),
  getCategoryWiseMonthlySales: vi.fn(),
  getCategoryWiseDailySales: vi.fn(),
}));

vi.mock(
  '../../src/analytics/analyticsServices.mjs',
  () => analyticsServicesMocks,
);

const analyticsController =
  await import('../../src/analytics/analyticsController.mjs');

describe('analytics controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when getRecentTransactions payload is invalid', async () => {
    const request = {
      query: { limit: 40, skip: 0 },
    };

    const response = createResponse();

    await analyticsController.getRecentTransactions(request, response);

    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(analyticsServicesMocks.getRecentTransactions).not.toHaveBeenCalled();
  });

  it('returns 200 when getRecentTransactions payload is valid', async () => {
    analyticsServicesMocks.getRecentTransactions.mockResolvedValue([
      {
        date: 'newdate',
        total: 50,
        id: 'id',
      },
    ]);
    const request = {
      query: {
        limit: 5,
        skip: 0,
      },
    };
    const response = createResponse();
    await analyticsController.getRecentTransactions(request, response);
    expect(response.statusCode).toBe(200);
    expect(response.payload.success).toBe(true);
    expect(analyticsServicesMocks.getRecentTransactions).toHaveBeenCalled();
    const [limit, skip] =
      analyticsServicesMocks.getRecentTransactions.mock.calls[0];
    expect(limit).toBe(5);
    expect(skip).toBe(0);
    expect(response.payload.recentTransactions[0]).toMatchObject({
      date: 'newdate',
      total: 50,
      id: 'id',
    });
  });

  it('returns 400 when getGraphData payload is invalid', async () => {
    const request = {
      query: {
        limit: 40,
      },
    };
    const response = createResponse();
    await analyticsController.getGraphData(request, response);
    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(analyticsServicesMocks.getMonthlySales).not.toHaveBeenCalled();
    expect(analyticsServicesMocks.getDailySales).not.toHaveBeenCalled();
  });

  it('returns 200 when getGraphData payload is valid', async () => {
    analyticsServicesMocks.getMonthlySales.mockResolvedValue([
      {
        month: 'jan',
        total: 50,
      },
    ]);
    analyticsServicesMocks.getDailySales.mockResolvedValue({
      total: 50,
    });
    const request = {
      query: {
        limit: 5,
      },
    };
    const response = createResponse();
    await analyticsController.getGraphData(request, response);
    expect(response.statusCode).toBe(200);
    expect(response.payload.success).toBe(true);
    expect(analyticsServicesMocks.getMonthlySales).toHaveBeenCalled();
    expect(analyticsServicesMocks.getDailySales).toHaveBeenCalled();
    const [limit] = analyticsServicesMocks.getMonthlySales.mock.calls[0];
    expect(limit).toBe(5);
    expect(response.payload.monthlySales[0]).toMatchObject({
      month: 'jan',
      total: 50,
    });
    expect(response.payload.todaySales).toMatchObject({
      total: 50,
    });
  });

  it('return 200 when getCategoryWiseSales payload is valid', async () => {
    const request = {
      query: {
        category: 'skincare',
        limit: 40,
      },
    };
    const response = createResponse();
    await analyticsController.getCategoryWiseSales(request, response);
    expect(response.statusCode).toBe(400);
    expect(
      analyticsServicesMocks.getCategoryWiseMonthlySales,
    ).not.toHaveBeenCalled();
    expect(
      analyticsServicesMocks.getCategoryWiseDailySales,
    ).not.toHaveBeenCalled();
  });

  it('return 200 when getCategoryWiseSales payload is valid', async () => {
    analyticsServicesMocks.getCategoryWiseMonthlySales.mockResolvedValue([
      {
        month: 'jan',
        total: 50,
      },
    ]);
    analyticsServicesMocks.getCategoryWiseDailySales.mockResolvedValue({
      total: 50,
    });
    const request = {
      query: {
        category: 'skincare',
        limit: 5,
      },
    };
    const response = createResponse();
    await analyticsController.getCategoryWiseSales(request, response);
    expect(response.statusCode).toBe(200);
    expect(
      analyticsServicesMocks.getCategoryWiseMonthlySales,
    ).toHaveBeenCalled();
    expect(analyticsServicesMocks.getCategoryWiseDailySales).toHaveBeenCalled();
    const [category, limit] =
      analyticsServicesMocks.getCategoryWiseMonthlySales.mock.calls[0];
    expect(category).toBe('skincare');
    expect(limit).toBe(5);
    expect(response.payload.categoryMonthlySales[0]).toMatchObject({
      month: 'jan',
      total: 50,
    });
    expect(response.payload.categoryTodaySales).toMatchObject({
      total: 50,
    });
  });
});
