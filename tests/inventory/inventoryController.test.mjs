import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResponse } from '../helpers/httpTestUtils.mjs';

const inventoryServiceMocks = vi.hoisted(() => ({
  addItem: vi.fn(),
  getItemName: vi.fn(),
  getItemInformation: vi.fn(),
  getSearchedItem: vi.fn(),
}));

const embMock = vi.hoisted(() => ({
  getEmbedding: vi.fn(),
}));

vi.mock('../../src/workers/inventory/jobServices.inventory.mjs', () => embMock);

vi.mock(
  '../../src/inventory/inventoryServices.mjs',
  () => inventoryServiceMocks,
);

const inventoryController =
  await import('../../src/inventory/inventoryController.mjs');

describe('inventoryController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('addItem payload is invalid', async () => {
    const request = {
      body: { name: 'Milk', price: -5, quantity: 2 },
    };
    const response = createResponse();

    await inventoryController.addItem(request, response);

    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(inventoryServiceMocks.addItem).not.toHaveBeenCalled();
  });

  it('addItem payload is valid', async () => {
    inventoryServiceMocks.addItem.mockResolvedValue();
    const request = {
      body: { name: 'Milk', price: 5, quantity: 2 },
    };
    const response = createResponse();
    await inventoryController.addItem(request, response);
    expect(response.statusCode).toBe(200);
    expect(response.payload.success).toBe(true);
    expect(inventoryServiceMocks.addItem).toHaveBeenCalledWith(request.body);
  });

  it('valid barcode lookup', async () => {
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
    expect(inventoryServiceMocks.getItemName).toHaveBeenCalledWith(
      '1234567890',
    );
  });

  it('getItemInformation payload is valid', async () => {
    inventoryServiceMocks.getItemInformation.mockResolvedValue([
      {
        name: 'Milk',
        price: 5,
        quantity: 2,
        expire: '4354354',
      },
    ]);
    const request = {
      query: { barcode: '1234567890' },
    };
    const response = createResponse();
    await inventoryController.getItemInformation(request, response);
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
      success: true,
      itemInformation: [
        {
          name: 'Milk',
          price: 5,
          quantity: 2,
          expire: '4354354',
        },
      ],
    });
    expect(inventoryServiceMocks.getItemInformation).toHaveBeenCalledWith(
      '1234567890',
    );
  });

  it('getSearchedItem payload is valid', async () => {
    inventoryServiceMocks.getSearchedItem.mockResolvedValue([
      {
        name: 'Milk',
        price: 5,
        quantity: 2,
        expire: '4354354',
        score: 0.9,
      },
    ]);
    embMock.getEmbedding.mockResolvedValue({ data: [0.1, 0.2, 0.3] });
    const request = {
      query: { name: 'Milk' },
    };
    const response = createResponse();
    await inventoryController.getSearchedItem(request, response);
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
      success: true,
      searchedItemList: [
        {
          name: 'Milk',
          price: 5,
          quantity: 2,
          expire: '4354354',
          score: 0.9,
        },
      ],
    });
    expect(inventoryServiceMocks.getSearchedItem).toHaveBeenCalledWith([
      0.1, 0.2, 0.3,
    ]);
    expect(embMock.getEmbedding).toHaveBeenCalledWith('Milk');
  });

  it('getSearchItem embedding failed', async () => {
    embMock.getEmbedding.mockResolvedValue({ data: [] });
    const request = {
      query: { name: 'Milk' },
    };
    const response = createResponse();
    await inventoryController.getSearchedItem(request, response);
    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual({
      success: false,
      error: 'Embedding not found',
    });
    expect(inventoryServiceMocks.getSearchedItem).not.toHaveBeenCalled();
    expect(embMock.getEmbedding).toHaveBeenCalledWith('Milk');
  });
});
