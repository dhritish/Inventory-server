import { vi, describe, expect, it, beforeEach } from 'vitest';
import { Cart } from '../../../src/cart/cartModels.mjs';
import * as cartJobServices from '../../../src/workers/cart/jobServices.cart.mjs';

vi.mock('../../../src/cart/cartModels.mjs');

describe('cartJobServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('get cart with user id', () => {
    const userId = '123';
    const session = 'session';
    const query = {
      session: vi.fn(),
    };
    Cart.findOne.mockReturnValue(query);
    cartJobServices.getCart(userId, session);
    expect(Cart.findOne).toHaveBeenCalledWith({ userId });
    expect(query.session).toHaveBeenCalledWith(session);
  });

  it('add new cart', () => {
    const userId = '123';
    const session = 'session';
    const product = {
      _id: '123',
    };
    const mockCart = {
      userId: '123',
      items: [],
      updatedAt: new Date(),
      save: vi.fn(),
    };
    Cart.mockReturnValue(mockCart);
    cartJobServices.addNewCart(userId, session, product);
    expect(Cart).toHaveBeenCalledWith({ userId });
    expect(product.quantity).toBe(1);
    expect(mockCart.save).toHaveBeenCalledWith({ session });
  });

  it('update cart', () => {
    const cart = {
      userId: '123',
      items: [
        {
          _id: '123',
          quantity: 1,
        },
      ],
      updatedAt: new Date(),
      save: vi.fn(),
    };
    const session = 'session';
    const product = {
      _id: '123',
      quantity: 1,
    };
    cartJobServices.updateCart(cart, session, product);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.save).toHaveBeenCalledWith({ session });
  });

  it('remove item from cart', () => {
    const cart = {
      userId: '123',
      items: [
        {
          _id: '123',
          quantity: 1,
        },
      ],
      updatedAt: new Date(),
      save: vi.fn(),
    };
    const session = 'session';
    const product = {
      _id: '123',
    };
    cartJobServices.removeItem(cart, session, product);
    expect(cart.items.length).toBe(0);
    expect(cart.save).toHaveBeenCalledWith({ session });
  });

  it('decrease item from cart', () => {
    const cart = {
      userId: '123',
      items: [
        {
          _id: '123',
          quantity: 2,
        },
      ],
      updatedAt: new Date(),
      save: vi.fn(),
    };
    const session = 'session';
    const product = {
      _id: '123',
    };
    cartJobServices.decreaseItem(cart, session, product);
    expect(cart.items[0].quantity).toBe(1);
    expect(cart.save).toHaveBeenCalledWith({ session });
  });
});
