import {
  generate_access_token,
  generate_refresh_token,
} from '../middleware/auth_middleware.mjs';
import { queue } from '../queue.mjs';
import * as authModels from './authModels.mjs';
import crypto from 'crypto';

const hashRefreshToken = token => {
  const cryptoSecret = process.env.CRYPTO_SECRET;
  if (!cryptoSecret) {
    throw new Error('CRYPTO_SECRET is required for refresh token hashing');
  }

  return crypto.createHmac('sha256', cryptoSecret).update(token).digest('hex');
};

export const userExists = email => {
  return authModels.User.findOne({ email });
};

export const signup = body => {
  return queue.add(
    'signup',
    { body },
    { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
  );
};

export const submitOTP = async body => {
  const userOTP = await authModels.UserOTP.findOne({
    email: body.email,
    otp: body.otp,
  })
    .select('email otp expiresAt -_id')
    .lean();
  if (!userOTP && userOTP.expiresAt < new Date()) return false;
  await authModels.User.create({
    username: body.username,
    email: body.email,
    password: body.password,
    role: body.role,
  });
  await authModels.UserOTP.deleteOne({
    email: body.email,
    otp: body.otp,
  });
  return true;
};

export const signin = async user => {
  const access_token = generate_access_token(user);
  const refresh_token = generate_refresh_token(user);
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const hashed_token = hashRefreshToken(refresh_token);
  const token_data = {
    token: hashed_token,
    user: user._id,
    expiresAt: date,
  };
  await authModels.UserToken.create(token_data);
  return { access_token, refresh_token };
};

export const signout = token => {
  const hashed_token = hashRefreshToken(token);
  return authModels.UserToken.updateOne(
    { token: hashed_token },
    { $set: { revoked: true } },
    { runValidators: true },
  );
};

export const refresh = async (token, userId) => {
  const hashed_token = hashRefreshToken(token);
  await authModels.UserToken.findOneAndUpdate(
    { token: hashed_token },
    { $set: { revoked: true } },
    { runValidators: true },
  );

  const user = await authModels.User.findById(userId);
  if (!user) {
    return;
  }
  const access_token = generate_access_token(user);
  const refresh_token = generate_refresh_token(user);
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const next_hashed_token = hashRefreshToken(refresh_token);
  const token_data = {
    token: next_hashed_token,
    user: user._id,
    expiresAt: date,
  };
  await authModels.UserToken.create(token_data);
  return { access_token, refresh_token };
};

export const postDeviceToken = (deviceToken, user) => {
  return authModels.DeviceToken.updateOne(
    { user: user },
    { $set: { devicetoken: deviceToken } },
    { upsert: true },
  );
};
