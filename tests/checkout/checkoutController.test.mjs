import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResponse } from '../helpers/httpTestUtils.mjs';

const checkoutServiceMocks = vi.hoisted(() => ({
  digitalCheckout: vi.fn(),
  cashCheckout: vi.fn(),
}));

const razorpayMocks = vi.hoisted(() => ({
  razorpayInstance: {
    qrCode: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../../src/checkout/checkoutServices.mjs', () => checkoutServiceMocks);

vi.mock('../../src/config/razorpay.mjs', () => razorpayMocks);

const checkoutController =
  await import('../../src/checkout/checkoutController.mjs');

describe('checkoutController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('digitalCheckout payload is valid', async () => {
    const qrcode = {
      id: 'order_123',
      amount: 5000,
      currency: 'INR',
      receipt: 'receipt#1',
    };
    razorpayMocks.razorpayInstance.qrCode.create.mockResolvedValue(qrcode);
    checkoutServiceMocks.digitalCheckout.mockResolvedValue();
    const request = {
      user: 'user-1',
      body: {
        data: [
          {
            _id: 'item-1',
            barcode: '1234567890',
            name: 'Milk',
            price: 50,
            expire: '2026-03-26T10:00:00.000Z',
            quantity: 1,
            category: 'dairy',
          },
        ],
        total: 50,
      },
    };
    const response = createResponse();
    await checkoutController.digitalCheckout(request, response);
    expect(razorpayMocks.razorpayInstance.qrCode.create).toHaveBeenCalledWith({
      type: 'upi_qr',
      name: 'Store_1',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: 50 * 100,
      description: 'For Store 1',
      notes: {
        purpose: 'Test UPI QR code notes',
      },
    });
    expect(checkoutServiceMocks.digitalCheckout).toHaveBeenCalledWith(
      request.body.data,
      50,
      qrcode,
      'user-1',
    );
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ success: true, qrcode });
  });

  it('digitalCheckout payload is invalid', async () => {
    const request = {
      user: 'user-1',
      body: {
        data: [],
        total: '50',
      },
    };
    const response = createResponse();

    await checkoutController.digitalCheckout(request, response);

    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(razorpayMocks.razorpayInstance.qrCode.create).not.toHaveBeenCalled();
    expect(checkoutServiceMocks.digitalCheckout).not.toHaveBeenCalled();
  });

  it('cashCheckout payload is valid', async () => {
    checkoutServiceMocks.cashCheckout.mockResolvedValue();
    const request = {
      user: 'user-1',
      body: {
        data: [
          {
            _id: 'item-1',
            barcode: '1234567890',
            name: 'Milk',
            price: 50,
            expire: '2026-03-26T10:00:00.000Z',
            quantity: 1,
            category: 'dairy',
          },
        ],
        total: 50,
      },
    };
    const response = createResponse();
    await checkoutController.cashCheckout(request, response);
    expect(checkoutServiceMocks.cashCheckout).toHaveBeenCalledWith(
      request.body.data,
      50,
      'user-1',
    );
    expect(response.statusCode).toBe(200);
    expect(response.payload.success).toBe(true);
  });

  it('cashCheckout payload is invalid', async () => {
    const request = {
      user: 'user-1',
      body: {
        data: [],
        total: '50',
      },
    };
    const response = createResponse();
    await checkoutController.cashCheckout(request, response);
    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(checkoutServiceMocks.cashCheckout).not.toHaveBeenCalled();
  });
});
