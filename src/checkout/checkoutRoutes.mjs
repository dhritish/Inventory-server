import express from 'express';
import * as checkoutController from './checkoutController.mjs';
import { verifytoken_access } from '../middleware/auth_middleware.mjs';

const router = express.Router();

router.post(
  '/digitalCheckout',
  verifytoken_access,
  checkoutController.digitalCheckout,
);
router.post(
  '/cashCheckout',
  verifytoken_access,
  checkoutController.cashCheckout,
);

export default router;
