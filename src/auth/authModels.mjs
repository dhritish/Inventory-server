import mongoose from 'mongoose';

const user = new mongoose.Schema({
  username: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  email: {
    type: mongoose.Schema.Types.String,
    required: true,
    unique: true,
  },
  password: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  role: {
    type: mongoose.Schema.Types.String,
    enum: ['employee', 'owner', 'customer'],
    default: 'customer',
    required: true,
  },
});

const userToken = new mongoose.Schema({
  token: {
    type: mongoose.Schema.Types.String,
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: mongoose.Schema.Types.Date,
    required: true,
    index: true,
  },
  revoked: {
    type: mongoose.Schema.Types.Boolean,
    default: false,
  },
});

const deviceToken = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  devicetoken: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
});

const userOTP = new mongoose.Schema({
  username: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  email: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  password: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  otp: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  role: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  expiresAt: {
    type: mongoose.Schema.Types.Date,
    required: true,
  },
});
userOTP.index({ otp: 1, email: 1 });

export const User = mongoose.model('User', user);
export const UserToken = mongoose.model('UserToken', userToken);
export const DeviceToken = mongoose.model('DeviceToken', deviceToken);
export const UserOTP = mongoose.model('UserOTP', userOTP);
