import express from 'express';
import * as authController from './authController.mjs';
import {
  comparePassword,
  hashPassword,
  verifytoken_access,
  verifytoken_refresh,
} from '../middleware/auth_middleware.mjs';

const router = express.Router();

router.post('/signup', hashPassword, authController.signup);
router.post('/submitOTP', hashPassword, authController.submitOTP);
router.post('/signin', comparePassword, authController.signin);
router.post('/signout', verifytoken_refresh, authController.signout);
router.post('/refresh', verifytoken_refresh, authController.refresh);
router.post(
  '/postDeviceToken',
  verifytoken_access,
  authController.postDeviceToken,
);

export default router;
