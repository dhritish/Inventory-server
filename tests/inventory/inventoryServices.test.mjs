import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  TotalOfItems: {
    findOne: vi.fn(),
  },
  ItemsWithExpire: {
    find: vi.fn(),
    aggregate: vi.fn(),
  },
}));

const queueMocks = vi.hoisted(() => ({
  add: vi.fn(),
}));

vi.mock('../../src/queue.mjs', () => ({
  queue: queueMocks,
}));

vi.mock('../../src/inventory/inventoryModels.mjs', () => ({
  TotalOfItems: dbMocks.TotalOfItems,
  ItemsWithExpire: dbMocks.ItemsWithExpire,
}));

const inventoryServices =
  await import('../../src/inventory/inventoryServices.mjs');

describe('inventoryServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('addItem', async () => {
    const body = {
      barcode: '123',
      name: 'item',
      price: 10,
      quantity: 10,
    };
    queueMocks.add.mockReturnValue({});
    await inventoryServices.addItem(body);
    expect(queueMocks.add).toHaveBeenCalledWith(
      'additem',
      { body },
      { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
    );
  });

  it('getItemName', async () => {
    const barcode = '123';
    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({}),
    };
    dbMocks.TotalOfItems.findOne.mockReturnValue(query);
    await inventoryServices.getItemName(barcode);
    expect(dbMocks.TotalOfItems.findOne).toHaveBeenCalledWith({ barcode });
    expect(query.select).toHaveBeenCalledWith('name -_id');
    expect(query.lean).toHaveBeenCalled();
  });

  it('getItemInformation', async () => {
    const barcode = '123';
    const query = {
      select: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    };
    dbMocks.ItemsWithExpire.find.mockReturnValue(query);
    await inventoryServices.getItemInformation(barcode);
    expect(dbMocks.ItemsWithExpire.find).toHaveBeenCalledWith({
      barcode,
      quantity: { $gt: 0 },
    });
    expect(query.select).toHaveBeenCalledWith(
      'name price quantity expire category',
    );
    expect(query.sort).toHaveBeenCalledWith({ expire: 1 });
    expect(query.lean).toHaveBeenCalled();
  });

  it('getSearchedItem', async () => {
    const embedding = [1, 2, 3];
    await inventoryServices.getSearchedItem(embedding);
    expect(dbMocks.ItemsWithExpire.aggregate).toHaveBeenCalledWith([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: embedding,
          numCandidates: 100,
          limit: 20,
        },
      },
      {
        $project: {
          name: 1,
          price: 1,
          quantity: 1,
          expire: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
      {
        $match: {
          score: { $gt: 0.7 },
          quantity: { $gt: 0 },
        },
      },
    ]);
  });
});
