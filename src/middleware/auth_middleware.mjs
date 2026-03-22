import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/authModels.mjs';

const saltRounds = process.env.SALT_ROUND;

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

export const hashPassword = async (request, response, next) => {
  const result = signupSchema.safeParse(request.body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  try {
    const { password } = request.body;
    const hash = await bcrypt.hash(password, saltRounds);
    request.body.password = hash;
    next();
  } catch (error) {
    response
      .status(500)
      .json({ success: false, error: 'Error hashing password' });
  }
};

export const comparePassword = async (request, response, next) => {
  const result = signinSchema.safeParse(request.body);
  if (!result.success) {
    return response.status(400).json({ success: false, error: result.error });
  }
  try {
    const { password, email } = request.body;
    const user = await User.findOne({ email });
    console.log(user);
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
  } catch (error) {
    response
      .status(500)
      .json({ success: false, error: 'error comparing passwords' });
  }
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
    console.log(error);
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
    console.log(error);
  }
};

export const verifytoken_access = (request, response, next) => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return response
        .status(401)
        .json({ success: false, error: 'user not authenticated' });
    }
    const verified = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (verified) {
      const decoded = jwt.decode(token);
      request.user = decoded.id;
      next();
    } else {
      return response
        .status(401)
        .json({ success: false, error: 'user not authenticated' });
    }
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return response
        .status(401)
        .json({ success: false, error: 'Invalid or expired token' });
    }
    return response
      .status(500)
      .json({ success: false, error: 'error verifying token' });
  }
};

export const verifytoken_refresh = (request, response, next) => {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return response
        .status(401)
        .json({ success: false, error: 'user not authenticated' });
    }
    const verified = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    if (verified) {
      next();
    } else {
      return response
        .status(401)
        .json({ success: false, error: 'user not authenticated' });
    }
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return response
        .status(401)
        .json({ success: false, error: 'Invalid or expired token' });
    }
    return response
      .status(500)
      .json({ success: false, error: 'error verifying token' });
  }
};
