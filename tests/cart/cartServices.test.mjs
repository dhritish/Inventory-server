import { vi, describe, expect, it, beforeEach } from 'vitest';
import { createResponse } from '../helpers/httpTestUtils.mjs';
import * as cartServices from '../../src/cart/cartServices.mjs';
import { queue } from '../../src/queue.mjs';
import { Cart } from '../../src/cart/cartModels.mjs';
import mongoose from 'mongoose';

vi.mock('../../src/queue.mjs', () => ({
  queue: {
    add: vi.fn(),
  },
}));

vi.mock('../../src/cart/cartModels.mjs', () => ({
  Cart: {
    aggregate: vi.fn(),
  },
}));

vi.mock('mongoose', () => ({
  default: {
    Types: {
      ObjectId: vi.fn(),
    },
  },
}));

describe('cartServices', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('successfully add to queue for addToCart', async () => {
    const product = { _id: '123' };
    const userId = '123';
    cartServices.addToCart(product, userId);
    expect(queue.add).toHaveBeenCalledWith(
      'addToCart',
      { product, userId },
      { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
    );
  });

  it('successfully add to queue for removeFromCart', async () => {
    const product = { _id: '123' };
    const userId = '123';
    cartServices.removeFromCart(product, userId);
    expect(queue.add).toHaveBeenCalledWith(
      'removeFromCart',
      { product, userId },
      { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
    );
  });

  it('successfully add to queue for decreaseFromCart', async () => {
    const product = { _id: '123' };
    const userId = '123';
    cartServices.decreseFromCart(product, userId);
    expect(queue.add).toHaveBeenCalledWith(
      'decreaseFromCart',
      { product, userId },
      { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
    );
  });

  it('successfully get cart', async () => {
    const userId = '123';
    cartServices.getCart(userId);
    expect(Cart.aggregate).toHaveBeenCalledWith(expect.any(Array));
  });
});
