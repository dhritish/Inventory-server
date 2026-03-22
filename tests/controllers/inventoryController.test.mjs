import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResponse } from '../helpers/httpTestUtils.mjs';

const inventoryServiceMocks = vi.hoisted(() => ({
  addItem: vi.fn(),
  getItemName: vi.fn(),
}));

vi.mock('../../src/services/inventoryServices.mjs', () => inventoryServiceMocks);

const inventoryController = await import(
  '../../src/controllers/inventoryController.mjs'
);

describe('inventoryController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when addItem payload is invalid', async () => {
    const request = {
      body: { name: 'Milk', price: -5, quantity: 2 },
    };
    const response = createResponse();

    await inventoryController.addItem(request, response);

    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(inventoryServiceMocks.addItem).not.toHaveBeenCalled();
  });

  it('returns item name for a valid barcode lookup', async () => {
    inventoryServiceMocks.getItemName.mockResolvedValue({ name: 'Rice' });

    const request = {
      query: { barcode: '1234567890' },
    };
    const response = createResponse();

    await inventoryController.getItemName(request, response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
      success: true,
      itemName: { name: 'Rice' },
    });
    expect(inventoryServiceMocks.getItemName).toHaveBeenCalledWith('1234567890');
  });
});
