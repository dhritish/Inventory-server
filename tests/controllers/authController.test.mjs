import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResponse } from '../helpers/httpTestUtils.mjs';

const authServiceMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  signin: vi.fn(),
  signup: vi.fn(),
}));

vi.mock('../../src/services/authServices.mjs', () => authServiceMocks);

const authController = await import('../../src/controllers/authController.mjs');

describe('authController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when signup payload is invalid', async () => {
    const request = {
      body: { username: 'Leo', email: 'not-an-email', password: '123' },
    };
    const response = createResponse();

    await authController.signup(request, response);

    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(authServiceMocks.signup).not.toHaveBeenCalled();
  });

  it('returns tokens on successful signin', async () => {
    authServiceMocks.signin.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });

    const request = {
      body: {
        username: 'Leo',
        email: 'leo@example.com',
        password: 'secret123',
      },
      user: { _id: 'user-1' },
    };
    const response = createResponse();

    await authController.signin(request, response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
      success: true,
      data: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      },
    });
    expect(authServiceMocks.signin).toHaveBeenCalledWith(request.user);
  });

  it('returns 401 when refresh service reports an invalid token', async () => {
    authServiceMocks.refresh.mockResolvedValue(undefined);

    const request = {
      headers: { authorization: 'Bearer stale-token' },
    };
    const response = createResponse();

    await authController.refresh(request, response);

    expect(authServiceMocks.refresh).toHaveBeenCalledWith('stale-token');
    expect(response.statusCode).toBe(401);
    expect(response.payload).toEqual({
      success: false,
      error: 'Invalid or expired token',
    });
  });
});
