import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => ({
  checkoutModels: {
    IndividualItemTransactions: {
      findOne: vi.fn(),
      find: vi.fn(),
    },
  },
  inventoryModels: {
    TotalOfItems: {
      findOne: vi.fn(),
    },
  },
  analyticsModels: {
    Categories: {
      find: vi.fn(),
    },
  },
  authModels: {
    DeviceToken: {
      find: vi.fn(),
    },
  },
  pipeline: vi.fn(),
  getFirebaseAdmin: vi.fn(),
  sendEachForMulticast: vi.fn(),
}));

vi.mock('../../src/models/checkoutModels.mjs', () => mockState.checkoutModels);
vi.mock('../../src/models/inventoryModels.mjs', () => mockState.inventoryModels);
vi.mock('../../src/models/analyticsModels.mjs', () => mockState.analyticsModels);
vi.mock('../../src/models/authModels.mjs', () => mockState.authModels);
vi.mock('@xenova/transformers', () => ({
  pipeline: mockState.pipeline,
}));
vi.mock('../../src/config/firebase.mjs', () => ({
  getFirebaseAdmin: mockState.getFirebaseAdmin,
}));

const jobServices = await import('../../src/workers/jobServices.mjs');

describe('jobServices get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.getFirebaseAdmin.mockReturnValue({
      messaging: () => ({
        sendEachForMulticast: mockState.sendEachForMulticast,
      }),
    });
  });

  it('getUserFromIndividualItemTransaction returns the user query result', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ user: '123' }),
    };
    mockState.checkoutModels.IndividualItemTransactions.findOne.mockReturnValue(
      query,
    );

    const result = await jobServices.getUserFromIndividualItemTransaction('qr1');

    expect(
      mockState.checkoutModels.IndividualItemTransactions.findOne,
    ).toHaveBeenCalledWith({ qr_id: 'qr1' });
    expect(query.select).toHaveBeenCalledWith('user -_id');
    expect(query.lean).toHaveBeenCalled();
    expect(result).toEqual({ user: '123' });
  });

  it('getDeviceToken returns selected device tokens', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ devicetoken: 'abc' }]),
    };
    mockState.authModels.DeviceToken.find.mockReturnValue(query);

    const result = await jobServices.getDeviceToken('123');

    expect(mockState.authModels.DeviceToken.find).toHaveBeenCalledWith({
      user: '123',
    });
    expect(query.select).toHaveBeenCalledWith('devicetoken -_id');
    expect(query.lean).toHaveBeenCalled();
    expect(result).toEqual([{ devicetoken: 'abc' }]);
  });

  it('sendNotification returns early when no user is found', async () => {
    const userQuery = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(null),
    };
    mockState.checkoutModels.IndividualItemTransactions.findOne.mockReturnValue(
      userQuery,
    );

    const result = await jobServices.sendNotification('qr1', 'Success', 500);

    expect(result).toBeUndefined();
    expect(mockState.authModels.DeviceToken.find).not.toHaveBeenCalled();
    expect(mockState.sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('sendNotification returns early when no device tokens are found', async () => {
    const userQuery = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ user: '123' }),
    };
    const tokenQuery = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    };
    mockState.checkoutModels.IndividualItemTransactions.findOne.mockReturnValue(
      userQuery,
    );
    mockState.authModels.DeviceToken.find.mockReturnValue(tokenQuery);

    const result = await jobServices.sendNotification('qr1', 'Success', 500);

    expect(result).toBeUndefined();
    expect(mockState.authModels.DeviceToken.find).toHaveBeenCalledWith({
      user: '123',
    });
    expect(mockState.sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('sendNotification sends a multicast message for available device tokens', async () => {
    const userQuery = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ user: '123' }),
    };
    const tokenQuery = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { devicetoken: 'token-1' },
        { devicetoken: 'token-2' },
      ]),
    };
    mockState.checkoutModels.IndividualItemTransactions.findOne.mockReturnValue(
      userQuery,
    );
    mockState.authModels.DeviceToken.find.mockReturnValue(tokenQuery);
    mockState.sendEachForMulticast.mockResolvedValue({ successCount: 2 });

    const result = await jobServices.sendNotification('qr1', 'Success', 500);

    expect(mockState.sendEachForMulticast).toHaveBeenCalledWith({
      tokens: ['token-1', 'token-2'],
      notification: {
        title: 'Payment Success',
        body: '500',
      },
      data: {
        title: 'Payment Success',
        body: '500',
      },
    });
    expect(result).toEqual({ successCount: 2 });
  });

  it('getIndividualItemTransaction uses the session and selection chain', async () => {
    const session = { id: 's1' };
    const query = {
      session: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    };
    mockState.checkoutModels.IndividualItemTransactions.find.mockReturnValue(
      query,
    );

    const result = await jobServices.getIndividualItemTransaction('qr1', session);

    expect(
      mockState.checkoutModels.IndividualItemTransactions.find,
    ).toHaveBeenCalledWith({ qr_id: 'qr1' });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(query.select).toHaveBeenCalledWith(
      'name price quantity expire sold_date category -_id',
    );
    expect(query.lean).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('getEmbedding loads the embedding pipeline and runs it with normalized mean pooling', async () => {
    const embedder = vi.fn().mockResolvedValue({ data: [1, 2, 3] });
    mockState.pipeline.mockResolvedValue(embedder);

    const result = await jobServices.getEmbedding('coffee');

    expect(mockState.pipeline).toHaveBeenCalledWith(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
    );
    expect(embedder).toHaveBeenCalledWith('coffee', {
      pooling: 'mean',
      normalize: true,
    });
    expect(result).toEqual({ data: [1, 2, 3] });
  });

  it('getCategoryString joins category values with commas', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { category: 'snacks' },
        { category: 'drinks' },
      ]),
    };
    mockState.analyticsModels.Categories.find.mockReturnValue(query);

    const result = await jobServices.getCategoryString();

    expect(mockState.analyticsModels.Categories.find).toHaveBeenCalled();
    expect(query.select).toHaveBeenCalledWith('category -_id');
    expect(query.lean).toHaveBeenCalled();
    expect(result).toBe('snacks, drinks');
  });

  it('getCategoryEmbeddingOfItem returns category and embedding for the named item', async () => {
    const session = { id: 's1' };
    const query = {
      session: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        category: 'snacks',
        embedding: [0.1, 0.2],
      }),
    };
    mockState.inventoryModels.TotalOfItems.findOne.mockReturnValue(query);

    const result = await jobServices.getCategoryEmbeddingOfItem(
      { name: 'chips' },
      session,
    );

    expect(mockState.inventoryModels.TotalOfItems.findOne).toHaveBeenCalledWith({
      name: 'chips',
    });
    expect(query.session).toHaveBeenCalledWith(session);
    expect(query.select).toHaveBeenCalledWith('category embedding -_id');
    expect(query.lean).toHaveBeenCalled();
    expect(result).toEqual({
      category: 'snacks',
      embedding: [0.1, 0.2],
    });
  });
});
