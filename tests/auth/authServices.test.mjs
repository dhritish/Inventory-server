import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  User: {
    create: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
  },
  UserToken: {
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
  DeviceToken: {
    updateOne: vi.fn(),
  },
  UserOTP: {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
  generate_access_token: vi.fn(),
  generate_refresh_token: vi.fn(),
}));

const queueMocks = vi.hoisted(() => ({
  queue: {
    add: vi.fn(),
  },
}));

vi.mock('../../src/queue.mjs', () => queueMocks);

vi.mock('../../src/auth/authModels.mjs', () => ({
  User: dbMocks.User,
  UserToken: dbMocks.UserToken,
  DeviceToken: dbMocks.DeviceToken,
  UserOTP: dbMocks.UserOTP,
}));

vi.mock('../../src/middleware/auth_middleware.mjs', () => ({
  generate_access_token: dbMocks.generate_access_token,
  generate_refresh_token: dbMocks.generate_refresh_token,
}));

const authServices = await import('../../src/auth/authServices.mjs');

const hashRefreshToken = token => {
  return crypto
    .createHmac('sha256', process.env.CRYPTO_SECRET)
    .update(token)
    .digest('hex');
};

describe('authServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRYPTO_SECRET = 'crypto-secret';
  });

  it('userExists', async () => {
    const email = 'xyz@example.com';
    await authServices.userExists(email);
    expect(dbMocks.User.findOne).toHaveBeenCalledWith({ email });
  });

  it('signup', async () => {
    const body = {
      name: 'leo',
      email: 'xyz@example.com',
      password: 'password',
      role: 'customer',
    };
    await authServices.signup(body);
    expect(queueMocks.queue.add).toHaveBeenCalledWith(
      'signup',
      { body },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  });

  it('submitOTP', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue({
        email: 'xyz@example.com',
        otp: '123456',
        expiresAt: new Date().setDate(new Date().getDate() + 1),
      }),
    };
    dbMocks.UserOTP.findOne.mockReturnValue(query);
    const result = await authServices.submitOTP({
      username: 'leo',
      email: 'xyz@example.com',
      otp: '123456',
      password: 'password',
      role: 'customer',
    });
    expect(dbMocks.UserOTP.findOne).toHaveBeenCalledWith({
      email: 'xyz@example.com',
      otp: '123456',
    });
    expect(query.select).toHaveBeenCalledWith('email otp expiresAt -_id');
    expect(query.lean).toHaveBeenCalled();
    expect(dbMocks.User.create).toHaveBeenCalledWith({
      username: 'leo',
      email: 'xyz@example.com',
      password: 'password',
      role: 'customer',
    });
    expect(dbMocks.UserOTP.deleteOne).toHaveBeenCalledWith({
      email: 'xyz@example.com',
      otp: '123456',
    });
    expect(result).toBe(true);
  });

  it('signin', async () => {
    const user = {
      _id: '123',
      name: 'leo',
      email: 'xyz@example.com',
    };
    dbMocks.generate_access_token.mockReturnValue('access_token');
    dbMocks.generate_refresh_token.mockReturnValue('refresh_token');
    const hashed_token = hashRefreshToken('refresh_token');
    const result = await authServices.signin(user);
    expect(dbMocks.generate_access_token).toHaveBeenCalledWith(user);
    expect(dbMocks.generate_refresh_token).toHaveBeenCalledWith(user);
    expect(dbMocks.UserToken.create).toHaveBeenCalledWith({
      token: hashed_token,
      user: user._id,
      expiresAt: expect.any(Date),
    });
    expect(result).toEqual({
      access_token: 'access_token',
      refresh_token: 'refresh_token',
    });
  });

  it('signout', async () => {
    const hashed_token = hashRefreshToken('token');
    await authServices.signout('token');
    expect(dbMocks.UserToken.updateOne).toHaveBeenCalledWith(
      { token: hashed_token },
      { $set: { revoked: true } },
      { runValidators: true },
    );
  });

  it('refresh', async () => {
    dbMocks.User.findById.mockResolvedValue({
      _id: '123',
      name: 'leo',
      email: 'xyz@example.com',
    });
    dbMocks.generate_access_token.mockReturnValue('access_token');
    dbMocks.generate_refresh_token.mockReturnValue('refresh_token');
    const hashed_token = hashRefreshToken('token');
    const next_hashed_token = hashRefreshToken('refresh_token');
    const result = await authServices.refresh('token', 'userId');
    expect(dbMocks.UserToken.updateOne).toHaveBeenCalledWith(
      { token: hashed_token },
      { $set: { revoked: true } },
      { runValidators: true },
    );
    expect(dbMocks.User.findById).toHaveBeenCalledWith('userId');
    expect(dbMocks.generate_access_token).toHaveBeenCalledWith({
      _id: '123',
      name: 'leo',
      email: 'xyz@example.com',
    });
    expect(dbMocks.generate_refresh_token).toHaveBeenCalledWith({
      _id: '123',
      name: 'leo',
      email: 'xyz@example.com',
    });
    expect(dbMocks.UserToken.create).toHaveBeenCalledWith({
      token: next_hashed_token,
      user: '123',
      expiresAt: expect.any(Date),
    });
  });

  it('postDeviceToken', async () => {
    const deviceToken = 'deviceToken';
    const user = 'user';
    await authServices.postDeviceToken(deviceToken, user);
    expect(dbMocks.DeviceToken.updateOne).toHaveBeenCalledWith(
      { user: user },
      { $set: { devicetoken: deviceToken } },
      { upsert: true },
    );
  });
});
