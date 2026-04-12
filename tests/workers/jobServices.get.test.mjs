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
    IndividualItemMonthlySales: {
      find: vi.fn(),
    },
  },
  authModels: {
    DeviceToken: {
      find: vi.fn(),
    },
  },
  fs: {
    mkdirSync: vi.fn(),
    createWriteStream: vi.fn(),
  },
  pdf: {
    instances: [],
  },
  pipeline: vi.fn(),
  getFirebaseAdmin: vi.fn(),
  sendEachForMulticast: vi.fn(),
  getTransporter: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock(
  '../../src/checkout/checkoutModels.mjs',
  () => mockState.checkoutModels,
);
vi.mock(
  '../../src/inventory/inventoryModels.mjs',
  () => mockState.inventoryModels,
);
vi.mock(
  '../../src/analytics/analyticsModels.mjs',
  () => mockState.analyticsModels,
);
vi.mock('../../src/auth/authModels.mjs', () => mockState.authModels);
vi.mock('@xenova/transformers', () => ({
  pipeline: mockState.pipeline,
}));
vi.mock('../../src/config/firebase.mjs', () => ({
  getFirebaseAdmin: mockState.getFirebaseAdmin,
}));
vi.mock('../../src/config/mailer.mjs', () => ({
  getTransporter: mockState.getTransporter,
}));
vi.mock('fs', () => ({
  default: mockState.fs,
}));
vi.mock('pdfkit', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const instance = {
        page: {
          height: 842,
          width: 595,
          margins: {
            top: 30,
            bottom: 30,
            left: 30,
            right: 30,
          },
        },
        y: 60,
        pipe: vi.fn(stream => {
          instance.stream = stream;
        }),
        font: vi.fn().mockReturnThis(),
        fontSize: vi.fn().mockReturnThis(),
        heightOfString: vi.fn(() => 12),
        text: vi.fn(),
        moveDown: vi.fn(),
        addPage: vi.fn(() => {
          instance.y = instance.page.margins.top;
          return instance;
        }),
        moveTo: vi.fn().mockReturnThis(),
        lineTo: vi.fn().mockReturnThis(),
        stroke: vi.fn().mockReturnThis(),
        on: vi.fn((event, handler) => {
          instance.events.set(event, handler);
          return instance;
        }),
        events: new Map(),
        end: vi.fn(() => {
          instance.events.get('data')?.(Buffer.from('pdf-part-1'));
          instance.events.get('data')?.(Buffer.from('pdf-part-2'));
          instance.events.get('end')?.();
        }),
        once: vi.fn(),
      };
      instance.once.mockImplementation((event, handler) => {
        instance.events.set(event, handler);
        return instance;
      });
      mockState.pdf.instances.push(instance);
      return instance;
    }),
  };
});

const jobServices = await import('../../src/workers/jobServices.get.mjs');

describe('jobServices get', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.pdf.instances.length = 0;
    mockState.getFirebaseAdmin.mockReturnValue({
      messaging: () => ({
        sendEachForMulticast: mockState.sendEachForMulticast,
      }),
    });
    mockState.getTransporter.mockReturnValue({
      sendMail: mockState.sendMail,
    });
    mockState.sendMail.mockResolvedValue({ messageId: 'mail-1' });
  });

  it('getUserFromIndividualItemTransaction returns the user query result', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ user: '123' }),
    };
    mockState.checkoutModels.IndividualItemTransactions.findOne.mockReturnValue(
      query,
    );

    const result =
      await jobServices.getUserFromIndividualItemTransaction('qr1');

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
      lean: vi
        .fn()
        .mockResolvedValue([
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

    const result = await jobServices.getIndividualItemTransaction(
      'qr1',
      session,
    );

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
      lean: vi
        .fn()
        .mockResolvedValue([{ category: 'snacks' }, { category: 'drinks' }]),
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

    expect(mockState.inventoryModels.TotalOfItems.findOne).toHaveBeenCalledWith(
      {
        name: 'chips',
      },
    );
    expect(query.session).toHaveBeenCalledWith(session);
    expect(query.select).toHaveBeenCalledWith('category embedding -_id');
    expect(query.lean).toHaveBeenCalled();
    expect(result).toEqual({
      category: 'snacks',
      embedding: [0.1, 0.2],
    });
  });

  it('getReport builds a pdf buffer and emails it as an attachment', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T00:00:00.000Z'));

    const stockQuery = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({ quantity: 3 }),
    };
    mockState.inventoryModels.TotalOfItems.findOne.mockReturnValue(stockQuery);

    const salesQuery = {
      cursor: vi.fn().mockReturnValue(
        (async function* () {
          yield {
            name: 'chips',
            price: 10,
            quantity: 8,
            category: 'snacks',
          };
        })(),
      ),
    };
    mockState.analyticsModels.IndividualItemMonthlySales.find.mockReturnValue(
      salesQuery,
    );

    await jobServices.getReport();
    const pdfDoc = mockState.pdf.instances[0];
    const expectedMonth = new Date(Date.UTC(2026, 2, 1));

    expect(
      mockState.analyticsModels.IndividualItemMonthlySales.find.mock.calls[0][0].month.getTime(),
    ).toBe(expectedMonth.getTime());
    expect(mockState.inventoryModels.TotalOfItems.findOne).toHaveBeenCalledWith(
      {
        name: 'chips',
        price: 10,
      },
    );
    expect(stockQuery.select).toHaveBeenCalledWith('quantity -_id');
    expect(stockQuery.lean).toHaveBeenCalled();
    expect(pdfDoc.text).toHaveBeenCalledWith('Inventory Report', {
      align: 'center',
    });
    expect(pdfDoc.font).toHaveBeenCalledWith('Courier');
    expect(pdfDoc.fontSize).toHaveBeenCalledWith(10);
    expect(pdfDoc.heightOfString).toHaveBeenCalled();
    expect(pdfDoc.text).toHaveBeenCalledWith('Name', 30, expect.any(Number), {
      width: 170,
      align: 'left',
      lineBreak: false,
    });
    expect(pdfDoc.text).toHaveBeenCalledWith('chips', 30, expect.any(Number), {
      width: 170,
      align: 'left',
      lineBreak: false,
    });
    expect(mockState.sendMail).toHaveBeenCalledWith({
      from: process.env.SMTP_USER,
      to: 'wedphoto5dec@gmail.com',
      subject: `Inventory Report for ${expectedMonth.toISOString()}`,
      attachments: [
        {
          filename: `report-${expectedMonth.toISOString()}.pdf`,
          content: Buffer.concat([
            Buffer.from('pdf-part-1'),
            Buffer.from('pdf-part-2'),
          ]),
          contentType: 'application/pdf',
        },
      ],
    });

    vi.useRealTimers();
  });
});
