import {
  generate_access_token,
  generate_refresh_token,
} from '../middleware/auth_middleware.mjs';
import * as authModels from '../models/authModels.mjs';

export const signup = body => {
  const newuser = new authModels.User(body);
  return newuser.save();
};

export const signin = async user => {
  const access_token = generate_access_token(user);
  const refresh_token = generate_refresh_token(user);
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const token_data = {
    token: refresh_token,
    user: user._id,
    expiresAt: date,
  };
  const new_refresh_token = new authModels.UserToken(token_data);
  await new_refresh_token.save();
  return { access_token, refresh_token };
};

export const signout = token => {
  return authModels.UserToken.updateOne(
    { token: token },
    { $set: { revoked: true } },
    { runValidators: true },
  );
};

export const refresh = async (token, userId) => {
  await authModels.UserToken.findOneAndUpdate(
    { token: token },
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
  const token_data = {
    token: refresh_token,
    user: user._id,
    expiresAt: date,
  };
  const new_tokend_data = new authModels.UserToken(token_data);
  await new_tokend_data.save();
  return { access_token, refresh_token };
};

export const postDeviceToken = (deviceToken, user) => {
  return authModels.DeviceToken.updateOne(
    { user: user },
    { $set: { devicetoken: deviceToken } },
    { upsert: true },
  );
};
