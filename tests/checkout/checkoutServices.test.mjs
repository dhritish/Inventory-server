import { beforeEach, describe, expect, it, vi } from 'vitest';

const queueMocks = vi.hoisted(() => ({
  queue: {
    add: vi.fn(),
  },
}));

vi.mock('../../src/queue.mjs', () => queueMocks);

const checkoutServices =
  await import('../../src/checkout/checkoutServices.mjs');

describe('checkoutServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enqueues a cash checkout job with enriched item data', async () => {
    const items = [
      {
        _id: 'item-1',
        name: 'Bread',
        price: 30,
        quantity: 2,
        category: 'bakery',
      },
    ];

    await checkoutServices.cashCheckout(items, 60, 'user-1');

    expect(queueMocks.queue.add).toHaveBeenCalledTimes(1);
    const [jobName, payload, options] = queueMocks.queue.add.mock.calls[0];

    expect(jobName).toBe('cash');
    expect(payload.total).toBe(60);
    expect(payload.data[0]).toMatchObject({
      _id: 'item-1',
      name: 'Bread',
      price: 30,
      quantity: 2,
      category: 'bakery',
      user: 'user-1',
      status: 'success',
    });
    expect(payload.data[0].sold_date).toBeInstanceOf(Date);
    expect(options).toMatchObject({
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    });
  });

  it('enqueues a digital checkout job with Razorpay order id', async () => {
    const items = [
      {
        _id: 'item-2',
        name: 'Juice',
        price: 50,
        quantity: 1,
        category: 'drinks',
      },
    ];

    await checkoutServices.digitalCheckout(
      items,
      50,
      { id: 'order_123' },
      'user-2',
    );

    expect(queueMocks.queue.add).toHaveBeenCalledTimes(1);
    const [jobName, payload, options] = queueMocks.queue.add.mock.calls[0];

    expect(jobName).toBe('digital');
    expect(payload.total).toBe(50);
    expect(payload.data[0]).toMatchObject({
      _id: 'item-2',
      qr_id: 'order_123',
      user: 'user-2',
    });
    expect(payload.data[0].sold_date).toBeInstanceOf(Date);
    expect(options).toMatchObject({
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
    });
  });
});
