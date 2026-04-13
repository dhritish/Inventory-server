import { beforeEach, describe, expect, it, vi } from 'vitest';

const jobServicesMocks = vi.hoisted(() => {
  return {
    getOTP: vi.fn(),
    addOTP: vi.fn(),
    sendOTP: vi.fn(),
  };
});

vi.mock(
  '../../../src/workers/auth/jobServices.auth.mjs',
  () => jobServicesMocks,
);

const authJobs = await import('../../../src/workers/auth/jobs.auth.mjs');

describe('authJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate otp and send otp', async () => {
    jobServicesMocks.getOTP.mockReturnValue('123456');
    jobServicesMocks.addOTP.mockResolvedValue();
    jobServicesMocks.sendOTP.mockResolvedValue();
    const body = {
      username: 'Leo',
      email: 'leo@example.com',
      password: 'secret123',
      role: 'customer',
    };
    await authJobs.signup(body);
    expect(jobServicesMocks.getOTP).toHaveBeenCalled();
    expect(jobServicesMocks.addOTP).toHaveBeenCalledWith({
      username: 'Leo',
      email: 'leo@example.com',
      password: 'secret123',
      role: 'customer',
      otp: '123456',
    });
    expect(jobServicesMocks.sendOTP).toHaveBeenCalledWith({
      username: 'Leo',
      email: 'leo@example.com',
      password: 'secret123',
      role: 'customer',
      otp: '123456',
    });
  });
});
