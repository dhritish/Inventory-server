import * as authServices from './authServices.mjs';
import { z } from 'zod';

const signupSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['employee', 'owner', 'customer']),
});

const submitOTPSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  otp: z.string().min(6).max(6),
  password: z.string(),
  role: z.enum(['employee', 'owner', 'customer']),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const postDeviceTokenSchema = z.object({
  user: z.string(),
  deviceToken: z.string(),
});

export const signup = async (request, response) => {
  const { body } = request;
  const result = signupSchema.safeParse(body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const userExists = await authServices.userExists(result.data.email);
  if (userExists) {
    return response
      .status(400)
      .json({ success: false, error: 'User already exists' });
  }
  await authServices.signup(result.data);
  return response.status(200).json({ success: true });
};

export const submitOTP = async (request, response) => {
  const { body } = request;
  const result = submitOTPSchema.safeParse(body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const isValid = await authServices.submitOTP(result.data);
  if (isValid === false) {
    return response.status(400).json({ success: false, error: 'Invalid OTP' });
  }
  return response.status(200).json({ success: true });
};

export const signin = async (request, response) => {
  const { body, user } = request;
  const result = signinSchema.safeParse(body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const tokens = await authServices.signin(user);
  if (request.headers?.['client-type'] === 'web') {
    return response
      .cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ success: true, accessToken: tokens.access_token });
  } else {
    return response.status(200).json({ success: true, data: tokens });
  }
};

export const signout = async (request, response) => {
  const { token } = request;
  if (!token) {
    return response
      .status(401)
      .json({ success: false, error: 'Token missing' });
  }
  await authServices.signout(token);
  return response.status(200).json({ success: true });
};

export const refresh = async (request, response) => {
  const { token, userId } = request;
  if (!token) {
    return response
      .status(401)
      .json({ success: false, error: 'Token missing' });
  }
  const user = await authServices.refresh(token, userId);
  if (user) {
    if (request.headers?.['client-type'] === 'web') {
      return response
        .cookie('refresh_token', user.refresh_token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .status(200)
        .json({ success: true, accessToken: user.access_token });
    } else {
      return response.status(200).json({ success: true, data: user });
    }
  } else {
    return response
      .status(401)
      .json({ success: false, error: 'User not found' });
  }
};

export const postDeviceToken = async (request, response) => {
  const { user } = request;
  const { deviceToken } = request.body;
  const result = postDeviceTokenSchema.safeParse({ user, deviceToken });
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  await authServices.postDeviceToken(deviceToken, user);
  return response.status(200).json({ success: true });
};
