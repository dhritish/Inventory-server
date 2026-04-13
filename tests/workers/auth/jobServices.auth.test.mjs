import { vi, beforeEach, it, describe, expect } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    UserOTP: {
      create: vi.fn(),
    },
    getTransporter: vi.fn(),
    sendMail: vi.fn(),
  };
});

vi.mock('../../../src/auth/authModels.mjs', () => ({
  UserOTP: mocks.UserOTP,
}));

vi.mock('../../../src/config/mailer.mjs', () => ({
  getTransporter: mocks.getTransporter,
}));

const authJobServices =
  await import('../../../src/workers/auth/jobServices.auth.mjs');

describe('authJobServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTransporter.mockReturnValue({
      sendMail: mocks.sendMail,
    });
    mocks.sendMail.mockResolvedValue();
    process.env.SMTP_USER = 'xyz@exmaple.com';
  });

  it('addOTP', () => {
    const body = {
      username: 'Leo',
      email: 'leo@example.com',
      password: 'secret123',
      role: 'customer',
      otp: '123456',
    };
    authJobServices.addOTP(body);
    expect(mocks.UserOTP.create).toHaveBeenCalledWith({
      ...body,
      expiresAt: expect.any(Date),
    });
  });

  it('sendOTP', () => {
    const body = {
      username: 'Leo',
      email: 'leo@example.com',
      password: 'secret123',
      role: 'customer',
      otp: '123456',
    };
    authJobServices.sendOTP(body);
    expect(mocks.getTransporter).toHaveBeenCalled();
    expect(mocks.sendMail).toHaveBeenCalledWith({
      from: 'xyz@exmaple.com',
      to: body.email,
      subject: 'OTP for sign up',
      text: `Your OTP is ${body.otp}`,
    });
  });
});
