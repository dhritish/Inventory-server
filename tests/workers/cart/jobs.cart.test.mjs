import { vi, describe, expect, it, beforeEach } from 'vitest';
import * as cartJobServices from '../../../src/workers/cart/jobServices.cart.mjs';
import * as cartJobs from '../../../src/workers/cart/jobs.cart.mjs';
import mongoose, { startSession } from 'mongoose';
import { end } from 'pdfkit';

vi.mock('mongoose', () => ({
  default: {
    startSession: vi.fn(),
  },
}));

vi.mock('../../../src/workers/cart/jobServices.cart.mjs', () => ({
  getCart: vi.fn(),
  addNewCart: vi.fn(),
  updateCart: vi.fn(),
  removeItem: vi.fn(),
  decreaseItem: vi.fn(),
}));

const session = {
  withTransaction: vi.fn(async callback => {
    await callback();
  }),
  endSession: vi.fn(),
};

describe('cartJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no cart found, add new cart', async () => {
    const data = {
      product: {
        _id: '123',
      },
      userId: '456',
    };
    mongoose.startSession.mockResolvedValue(session);
    cartJobServices.getCart.mockResolvedValue(null);
    await cartJobs.addToCart(data);
    expect(mongoose.startSession).toHaveBeenCalledTimes(1);
    expect(cartJobServices.getCart).toHaveBeenCalledWith(data.userId, session);
    expect(cartJobServices.addNewCart).toHaveBeenCalledWith(
      data.userId,
      session,
      data.product,
    );
    expect(cartJobServices.updateCart).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it('cart found, update cart', async () => {
    const data = {
      product: {
        _id: '123',
      },
      userId: '456',
    };
    const cart = {
      userId: '456',
      items: [
        {
          _id: '123',
          quantity: 1,
        },
      ],
    };
    mongoose.startSession.mockResolvedValue(session);
    cartJobServices.getCart.mockResolvedValue(cart);
    await cartJobs.addToCart(data);
    expect(mongoose.startSession).toHaveBeenCalledTimes(1);
    expect(cartJobServices.getCart).toHaveBeenCalledWith(data.userId, session);
    expect(cartJobServices.addNewCart).not.toHaveBeenCalled();
    expect(cartJobServices.updateCart).toHaveBeenCalledWith(
      cart,
      session,
      data.product,
    );
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });

  it('remove item from cart', async () => {
    const data = {
      product: {
        _id: '123',
      },
      userId: '456',
    };
    const cart = {
      userId: '456',
      items: [
        {
          _id: '123',
          quantity: 1,
        },
      ],
    };
    mongoose.startSession.mockResolvedValue(session);
    cartJobServices.getCart.mockResolvedValue(cart);
    await cartJobs.removeFromCart(data);
    expect(mongoose.startSession).toHaveBeenCalledTimes(1);
    expect(cartJobServices.getCart).toHaveBeenCalledWith(data.userId, session);
    expect(cartJobServices.removeItem).toHaveBeenCalledWith(
      cart,
      session,
      data.product,
    );
  });

  it('decrease item from cart', async () => {
    const data = {
      product: {
        _id: '123',
      },
      userId: '456',
    };
    const cart = {
      userId: '456',
      items: [
        {
          _id: '123',
          quantity: 1,
        },
      ],
    };
    mongoose.startSession.mockResolvedValue(session);
    cartJobServices.getCart.mockResolvedValue(cart);
    await cartJobs.decreaseFromCart(data);
    expect(mongoose.startSession).toHaveBeenCalledTimes(1);
    expect(cartJobServices.getCart).toHaveBeenCalledWith(data.userId, session);
    expect(cartJobServices.decreaseItem).toHaveBeenCalledWith(
      cart,
      session,
      data.product,
    );
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });
});
