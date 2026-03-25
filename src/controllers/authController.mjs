import * as authServices from '../services/authServices.mjs';
import { z } from 'zod';

const signupSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['employee', 'owner']).optional(),
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
  await authServices.signup(result.data);
  return response.status(200).json({ success: true });
};

export const signin = async (request, response) => {
  const { body, user } = request;
  const result = signinSchema.safeParse(body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const tokens = await authServices.signin(user);
  return response.status(200).json({ success: true, data: tokens });
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
    return response.status(200).json({ success: true, data: user });
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
