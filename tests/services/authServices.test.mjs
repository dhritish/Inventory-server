import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  User: {
    create: vi.fn(),
    findById: vi.fn(),
  },
  UserToken: {
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
  DeviceToken: {
    updateOne: vi.fn(),
  },
  generate_access_token: vi.fn(),
  generate_refresh_token: vi.fn(),
}));

vi.mock('../../src/models/authModels.mjs', () => ({
  User: dbMocks.User,
  UserToken: dbMocks.UserToken,
  DeviceToken: dbMocks.DeviceToken,
}));

vi.mock('../../src/middleware/auth_middleware.mjs', () => ({
  generate_access_token: dbMocks.generate_access_token,
  generate_refresh_token: dbMocks.generate_refresh_token,
}));

const authServices = await import('../../src/services/authServices.mjs');

describe('authServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signup', async () => {
    const body = {
      name: 'leo',
      email: 'xyz@example.com',
      password: 'password',
    };
    dbMocks.User.create.mockResolvedValue({});
    await authServices.signup(body);
    expect(dbMocks.User.create).toHaveBeenCalledWith(body);
  });

  it('signin', async () => {
    const user = {
      _id: '123',
      name: 'leo',
      email: 'xyz@example.com',
    };
    dbMocks.User.findById.mockResolvedValue({});
    dbMocks.generate_access_token.mockReturnValue('access_token');
    dbMocks.generate_refresh_token.mockReturnValue('refresh_token');
    await authServices.signin(user);
    expect(dbMocks.generate_access_token).toHaveBeenCalledWith(user);
    expect(dbMocks.generate_refresh_token).toHaveBeenCalledWith(user);
    expect(dbMocks.UserToken.create).toHaveBeenCalled();
    const [token_data] = dbMocks.UserToken.create.mock.calls[0];
    expect(token_data).toEqual({
      token: 'refresh_token',
      user: '123',
      expiresAt: expect.any(Date),
    });
  });

  it('signout', async () => {
    await authServices.signout('token');
    expect(dbMocks.UserToken.updateOne).toHaveBeenCalledWith(
      { token: 'token' },
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
    await authServices.refresh('token', 'userId');
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
      token: 'refresh_token',
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
