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
  const auth = request.headers.authorization;
  const token = auth && auth.split(' ')[1];
  await authServices.signout(token);
  return response.status(200).json({ success: true });
};

export const refresh = async (request, response) => {
  const auth = request.headers.authorization;
  const token = auth && auth.split(' ')[1];
  const user = await authServices.refresh(token);
  if (user) {
    return response.status(200).json({ success: true, data: user });
  }
  return response
    .status(401)
    .json({ success: false, error: 'Invalid or expired token' });
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
