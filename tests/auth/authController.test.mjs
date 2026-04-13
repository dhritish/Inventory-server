import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResponse } from '../helpers/httpTestUtils.mjs';

const authServiceMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  signin: vi.fn(),
  signup: vi.fn(),
  signout: vi.fn(),
  postDeviceToken: vi.fn(),
  submitOTP: vi.fn(),
  userExists: vi.fn(),
}));

vi.mock('../../src/auth/authServices.mjs', () => authServiceMocks);

const authController = await import('../../src/auth/authController.mjs');

describe('authController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRYPTO_SECRET = 'crypto-secret';
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
    expect(authServiceMocks.userExists).not.toHaveBeenCalled();
  });

  it('returns 200 when signup payload is valid', async () => {
    authServiceMocks.signup.mockResolvedValue();
    authServiceMocks.userExists.mockResolvedValue(null);
    const request = {
      body: {
        username: 'Leo',
        email: 'leo@example.com',
        password: 'secret123',
        role: 'customer',
      },
    };
    const response = createResponse();
    await authController.signup(request, response);
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ success: true });
    expect(authServiceMocks.userExists).toHaveBeenCalledWith(
      request.body.email,
    );
    expect(authServiceMocks.signup).toHaveBeenCalledWith(request.body);
  });

  it('returns 400 when submitOTP payload is invalid', async () => {
    const request = {
      body: {
        username: 'Leo',
        email: 'xyz@example.com',
        otp: '1234',
        password: 'secret123',
        role: 'customer',
      },
    };
    const response = createResponse();
    await authController.submitOTP(request, response);
    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(authServiceMocks.submitOTP).not.toHaveBeenCalled();
  });

  it('returns 200 when submitOTP payload is valid', async () => {
    authServiceMocks.submitOTP.mockResolvedValue(true);
    const request = {
      body: {
        username: 'Leo',
        email: 'leo@example.com',
        password: 'secret123',
        role: 'customer',
        otp: '123456',
      },
    };
    const response = createResponse();
    await authController.submitOTP(request, response);
    expect(authServiceMocks.submitOTP).toHaveBeenCalledWith({
      username: 'Leo',
      email: 'leo@example.com',
      password: 'secret123',
      role: 'customer',
      otp: '123456',
    });
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ success: true });
  });

  it('returns 400 when signin payload is invalid', async () => {
    const request = {
      body: {
        email: 'not-an-email',
        password: '123',
      },
      user: {
        _id: 'user-1',
      },
    };
    const response = createResponse();
    await authController.signin(request, response);
    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(authServiceMocks.signin).not.toHaveBeenCalled();
  });

  it('returns 200 on successful signin on web', async () => {
    authServiceMocks.signin.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });

    const request = {
      body: {
        email: 'leo@example.com',
        password: 'secret123',
      },
      user: { _id: 'user-1' },
      headers: { 'client-type': 'web' },
    };
    const response = createResponse();

    await authController.signin(request, response);
    expect(authServiceMocks.signin).toHaveBeenCalledWith(request.user);
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
      success: true,
      accessToken: 'access-token',
    });
  });

  it('return 200 on successful signin on mobile', async () => {
    authServiceMocks.signin.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
    const request = {
      body: {
        email: 'leo@example.com',
        password: 'secret123',
      },
      user: { _id: 'user-1' },
    };
    const response = createResponse();
    await authController.signin(request, response);
    expect(authServiceMocks.signin).toHaveBeenCalledWith(request.user);
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
      success: true,
      data: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      },
    });
  });

  it('return 401 when Token is missing in refresh request', async () => {
    const request = {
      userId: 'user-1',
    };
    const response = createResponse();
    await authController.refresh(request, response);
    expect(response.statusCode).toBe(401);
    expect(response.payload).toEqual({
      success: false,
      error: 'Token missing',
    });
    expect(authServiceMocks.refresh).not.toHaveBeenCalled();
  });

  it('returns 401 when refresh service reports an invalid token', async () => {
    authServiceMocks.refresh.mockResolvedValue(undefined);

    const request = {
      token: 'stale-token',
      userId: 'user-1',
    };
    const response = createResponse();

    await authController.refresh(request, response);

    expect(authServiceMocks.refresh).toHaveBeenCalledWith(
      'stale-token',
      'user-1',
    );
    expect(response.statusCode).toBe(401);
    expect(response.payload).toEqual({
      success: false,
      error: 'User not found',
    });
  });

  it('returns 200 on successful refresh for mobile', async () => {
    authServiceMocks.refresh.mockResolvedValue({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });
    const request = {
      token: 'stale-token',
      userId: 'user-1',
    };
    const response = createResponse();
    await authController.refresh(request, response);
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
      success: true,
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      },
    });
    expect(authServiceMocks.refresh).toHaveBeenCalledWith(
      'stale-token',
      'user-1',
    );
  });

  it('returns 200 on successful refresh for web', async () => {
    authServiceMocks.refresh.mockResolvedValue({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });
    const request = {
      token: 'stale-token',
      userId: 'user-1',
      headers: { 'client-type': 'web' },
    };
    const response = createResponse();
    await authController.refresh(request, response);
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({
      success: true,
      accessToken: 'new-access-token',
    });
    expect(authServiceMocks.refresh).toHaveBeenCalledWith(
      'stale-token',
      'user-1',
    );
  });

  it('returns 200 when signout payload is valid', async () => {
    authServiceMocks.signout.mockResolvedValue();
    const request = {
      token: 'stale-token',
    };
    const response = createResponse();
    await authController.signout(request, response);
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ success: true });
    expect(authServiceMocks.signout).toHaveBeenCalledWith('stale-token');
  });

  it('returns 200 when postDeviceToken payload is valid', async () => {
    authServiceMocks.postDeviceToken.mockResolvedValue();
    const request = {
      body: {
        deviceToken: 'device-token',
      },
      user: 'user-1',
    };
    const response = createResponse();
    await authController.postDeviceToken(request, response);
    expect(response.statusCode).toBe(200);
    expect(response.payload).toEqual({ success: true });
    expect(authServiceMocks.postDeviceToken).toHaveBeenCalledWith(
      'device-token',
      'user-1',
    );
  });
});
