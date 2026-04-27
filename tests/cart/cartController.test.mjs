import * as cartController from '../../src/cart/cartController.mjs';
import * as cartServices from '../../src/cart/cartServices.mjs';
import { vi, describe, expect, it, beforeEach } from 'vitest';
import { createResponse } from '../helpers/httpTestUtils.mjs';

vi.mock('../../src/cart/cartServices.mjs');

describe('cartController', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('return 200 status code in addToCart if body is valid', async () => {
    const request = {
      body: {
        _id: '123',
      },
      user: '123',
    };
    const response = createResponse();
    cartServices.addToCart.mockResolvedValue();
    await cartController.addToCart(request, response);
    expect(cartServices.addToCart).toHaveBeenCalledWith({ _id: '123' }, '123');
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ success: true });
  });

  it('return 400 status code in addToCart if body is invalid', async () => {
    const request = {
      body: {
        _id: '',
      },
      user: '123',
    };
    const response = createResponse();
    await cartController.addToCart(request, response);
    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(cartServices.addToCart).not.toHaveBeenCalled();
  });

  it('return 200 status code in getCart if body is valid', async () => {
    const request = {
      user: '123',
    };
    const cart = [
      {
        _id: '123',
        quantity: 1,
        name: 'product1',
        price: 100,
        url: 'url1',
        stock: 10,
      },
    ];
    const response = createResponse();
    cartServices.getCart.mockResolvedValue(cart);
    await cartController.getCart(request, response);
    expect(cartServices.getCart).toHaveBeenCalledWith('123');
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ success: true, cart });
  });

  it('return 200 status code in removeFromCart if body is valid', async () => {
    const request = {
      body: {
        _id: '123',
      },
      user: '123',
    };
    const response = createResponse();
    cartServices.removeFromCart.mockResolvedValue();
    await cartController.removeFromCart(request, response);
    expect(cartServices.removeFromCart).toHaveBeenCalledWith(
      { _id: '123' },
      '123',
    );
  });

  it('return 200 status code in decreaseFromCart if body is valid', async () => {
    const request = {
      body: {
        _id: '123',
      },
      user: '123',
    };
    const response = createResponse();
    cartServices.decreseFromCart.mockResolvedValue();
    await cartController.decreaseFromCart(request, response);
    expect(cartServices.decreseFromCart).toHaveBeenCalledWith(
      { _id: '123' },
      '123',
    );
  });
});
