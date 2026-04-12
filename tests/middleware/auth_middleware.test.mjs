import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createResponse } from '../helpers/httpTestUtils.mjs';

const mockState = vi.hoisted(() => ({
  bcrypt: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
  jwt: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
  User: {
    findOne: vi.fn(),
  },
  UserToken: {
    findOne: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: mockState.bcrypt,
}));

vi.mock('jsonwebtoken', () => ({
  default: mockState.jwt,
}));

vi.mock('../../src/auth/authModels.mjs', () => ({
  User: mockState.User,
  UserToken: mockState.UserToken,
}));

const authMiddleware = await import('../../src/middleware/auth_middleware.mjs');

describe('auth_middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = 'access-secret';
    process.env.REFRESH_TOKEN_SECRET = 'refresh-secret';
    process.env.SALT_ROUND = '10';
  });

  it('hashPassword hashes a valid password and calls next', async () => {
    const request = {
      body: {
        username: 'leo',
        email: 'leo@example.com',
        password: 'password',
      },
    };
    const response = createResponse();
    const next = vi.fn();

    mockState.bcrypt.hash.mockResolvedValue('hashed-password');

    await authMiddleware.hashPassword(request, response, next);

    expect(mockState.bcrypt.hash).toHaveBeenCalledWith('password', 10);
    expect(request.body.password).toBe('hashed-password');
    expect(next).toHaveBeenCalled();
  });

  it('hashPassword returns 400 for invalid signup payload', async () => {
    const request = {
      body: {
        username: 'leo',
        email: 'not-an-email',
        password: '123',
      },
    };
    const response = createResponse();
    const next = vi.fn();

    await authMiddleware.hashPassword(request, response, next);

    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(next).not.toHaveBeenCalled();
    expect(mockState.bcrypt.hash).not.toHaveBeenCalled();
  });

  it('comparePassword returns 400 for invalid signin payload', async () => {
    const request = {
      body: {
        email: 'bad-email',
        password: '123',
      },
    };
    const response = createResponse();
    const next = vi.fn();

    await authMiddleware.comparePassword(request, response, next);

    expect(response.statusCode).toBe(400);
    expect(response.payload.success).toBe(false);
    expect(mockState.User.findOne).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('comparePassword returns 401 when user is not found', async () => {
    const request = {
      body: {
        email: 'leo@example.com',
        password: 'password',
      },
    };
    const response = createResponse();
    const next = vi.fn();

    mockState.User.findOne.mockResolvedValue(null);

    await authMiddleware.comparePassword(request, response, next);

    expect(mockState.User.findOne).toHaveBeenCalledWith({
      email: 'leo@example.com',
    });
    expect(response.statusCode).toBe(401);
    expect(response.payload).toEqual({
      success: false,
      error: 'User not found',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('comparePassword returns 401 for wrong password', async () => {
    const request = {
      body: {
        email: 'leo@example.com',
        password: 'password',
      },
    };
    const response = createResponse();
    const next = vi.fn();
    const user = {
      _id: '123',
      email: 'leo@example.com',
      password: 'hashed-password',
    };

    mockState.User.findOne.mockResolvedValue(user);
    mockState.bcrypt.compare.mockResolvedValue(false);

    await authMiddleware.comparePassword(request, response, next);

    expect(request.user).toEqual(user);
    expect(mockState.bcrypt.compare).toHaveBeenCalledWith(
      'password',
      'hashed-password',
    );
    expect(response.statusCode).toBe(401);
    expect(response.payload).toEqual({
      success: false,
      error: 'Wrong password',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('comparePassword attaches the user and calls next for matching password', async () => {
    const request = {
      body: {
        email: 'leo@example.com',
        password: 'password',
      },
    };
    const response = createResponse();
    const next = vi.fn();
    const user = {
      _id: '123',
      email: 'leo@example.com',
      password: 'hashed-password',
      role: 'owner',
    };

    mockState.User.findOne.mockResolvedValue(user);
    mockState.bcrypt.compare.mockResolvedValue(true);

    await authMiddleware.comparePassword(request, response, next);

    expect(request.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });

  it('generate_access_token signs with the access secret and owner role', () => {
    mockState.jwt.sign.mockReturnValue('access-token');

    const token = authMiddleware.generate_access_token({
      _id: '123',
      role: 'owner',
    });

    expect(token).toBe('access-token');
    expect(mockState.jwt.sign).toHaveBeenCalledWith(
      { id: '123', role: 'owner' },
      'access-secret',
      { expiresIn: '15m' },
    );
  });

  it('generate_refresh_token signs with the refresh secret', () => {
    mockState.jwt.sign.mockReturnValue('refresh-token');

    const token = authMiddleware.generate_refresh_token({
      _id: '123',
    });

    expect(token).toBe('refresh-token');
    expect(mockState.jwt.sign).toHaveBeenCalledWith(
      { id: '123' },
      'refresh-secret',
      { expiresIn: '7d' },
    );
  });

  it('verifytoken_access returns 401 when the token is missing', () => {
    const request = {
      headers: {},
    };
    const response = createResponse();
    const next = vi.fn();

    authMiddleware.verifytoken_access(request, response, next);

    expect(response.statusCode).toBe(401);
    expect(response.payload).toEqual({
      success: false,
      error: 'Token missing',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('verifytoken_access sets request.user and calls next for a valid token', () => {
    const request = {
      headers: {
        authorization: 'Bearer access-token',
      },
    };
    const response = createResponse();
    const next = vi.fn();

    mockState.jwt.verify.mockReturnValue({ id: '123' });

    authMiddleware.verifytoken_access(request, response, next);

    expect(mockState.jwt.verify).toHaveBeenCalledWith(
      'access-token',
      'access-secret',
    );
    expect(request.user).toBe('123');
    expect(next).toHaveBeenCalled();
  });

  it('verifytoken_refresh returns 401 when the stored token is revoked', async () => {
    const request = {
      headers: {
        authorization: 'Bearer refresh-token',
      },
    };
    const response = createResponse();
    const next = vi.fn();

    mockState.jwt.verify.mockReturnValue({ id: '123' });
    mockState.UserToken.findOne.mockResolvedValue({
      token: 'refresh-token',
      revoked: true,
    });

    await authMiddleware.verifytoken_refresh(request, response, next);

    expect(request.token).toBe('refresh-token');
    expect(request.userId).toBe('123');
    expect(response.statusCode).toBe(401);
    expect(response.payload).toEqual({
      success: false,
      error: 'Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('verifytoken_refresh sets request state and calls next for a valid token', async () => {
    const request = {
      headers: {
        authorization: 'Bearer refresh-token',
      },
    };
    const response = createResponse();
    const next = vi.fn();

    mockState.jwt.verify.mockReturnValue({ id: '123' });
    mockState.UserToken.findOne.mockResolvedValue({
      token: 'refresh-token',
      revoked: false,
    });

    await authMiddleware.verifytoken_refresh(request, response, next);

    expect(mockState.jwt.verify).toHaveBeenCalledWith(
      'refresh-token',
      'refresh-secret',
    );
    expect(mockState.UserToken.findOne).toHaveBeenCalledWith({
      token: 'refresh-token',
    });
    expect(request.token).toBe('refresh-token');
    expect(request.userId).toBe('123');
    expect(next).toHaveBeenCalled();
  });
});
