import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserToken } from '../auth/authModels.mjs';
import { z } from 'zod';
import crypto from 'crypto';

const saltRounds = process.env.SALT_ROUND;

const signupSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['employee', 'owner', 'customer']),
  otp: z.string().optional(),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const hashRefreshToken = token => {
  const cryptoSecret = process.env.CRYPTO_SECRET;
  if (!cryptoSecret) {
    throw new Error('CRYPTO_SECRET is required for refresh token hashing');
  }

  return crypto.createHmac('sha256', cryptoSecret).update(token).digest('hex');
};

const getRefreshToken = token => {
  const hashed_token = hashRefreshToken(token);
  return UserToken.findOne({ token: hashed_token });
};

export const hashPassword = async (request, response, next) => {
  const result = signupSchema.safeParse(request.body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  const { password } = request.body;
  const hash = await bcrypt.hash(password, Number(saltRounds || 10));
  request.body.password = hash;
  next();
};

export const comparePassword = async (request, response, next) => {
  const result = signinSchema.safeParse(request.body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }

  const { password, email } = request.body;
  const user = await User.findOne({ email });
  if (!user) {
    return response
      .status(401)
      .json({ success: false, error: 'User not found' });
  }
  request.user = user;
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return response
      .status(401)
      .json({ success: false, error: 'Wrong password' });
  }
  next();
};

export const generate_access_token = user => {
  try {
    const { _id, role } = user;
    const token = jwt.sign(
      { id: _id, role: role },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: '15m',
      },
    );
    return token;
  } catch (error) {
    throw error;
  }
};

export const generate_refresh_token = user => {
  try {
    const { _id } = user;
    const token = jwt.sign({ id: _id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: '7d',
    });
    return token;
  } catch (error) {
    throw error;
  }
};

export const verifytoken_access = (request, response, next) => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return response
        .status(401)
        .json({ success: false, error: 'Token missing' });
    }
    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    request.user = verified.id;
    next();
  } catch (error) {
    return response.status(401).json({ success: false, error: error.name });
  }
};

export const verifytoken_refresh = async (request, response, next) => {
  try {
    let token;
    const isWeb = request.headers?.['client-type'] === 'web';
    if (isWeb) {
      token = request.cookies?.refresh_token;
    } else {
      const authHeader = request.headers?.authorization;
      token = authHeader && authHeader.split(' ')[1];
    }
    if (!token) {
      return response
        .status(401)
        .json({ success: false, error: 'Token missing' });
    }
    request.token = token;
    const verified = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    request.userId = verified.id;
    const refreshTokenInformation = await getRefreshToken(token);
    if (
      refreshTokenInformation &&
      !refreshTokenInformation.revoked &&
      refreshTokenInformation.expiresAt > new Date()
    ) {
      next();
    } else {
      return response
        .status(401)
        .json({ success: false, error: 'Invalid token' });
    }
  } catch (error) {
    return response.status(401).json({ success: false, error: error.name });
  }
};
