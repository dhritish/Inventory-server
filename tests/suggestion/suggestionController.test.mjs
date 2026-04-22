import { getTrending as getTrendingService } from '../../src/suggestion/suggestionServices.mjs';
import { getTrending as getTrendingC } from '../../src/suggestion/suggestionController.mjs';
import { beforeEach, describe, vi, it, expect } from 'vitest';
import { createResponse } from '../helpers/httpTestUtils.mjs';

vi.mock('../../src/suggestion/suggestionServices.mjs', () => ({
  getTrending: vi.fn(),
}));

describe('suggestion controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('return 400 when query is invalid', async () => {
    const request = {
      query: {
        limit: 'invalid',
      },
    };
    const response = createResponse();
    await getTrendingC(request, response);
    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual({
      success: false,
      error: expect.any(Object),
    });
  });

  it('return 200 when query is valid', async () => {
    const request = {
      query: {
        limit: 10,
      },
    };
    const response = createResponse();
    getTrendingService.mockResolvedValue([]);
    await getTrendingC(request, response);
    expect(response.statusCode).toBe(200);
    expect(getTrendingService).toHaveBeenCalledWith(10);
    expect(response.payload).toEqual({
      success: true,
      trendingProducts: [],
    });
  });
});
