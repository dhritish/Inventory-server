import express from 'express';
import * as checkoutController from './checkoutController.mjs';
import {
  authorization,
  verifytoken_access,
} from '../middleware/auth_middleware.mjs';

const router = express.Router();

router.post(
  '/digitalCheckout',
  verifytoken_access,
  authorization(['employee', 'owner']),
  checkoutController.digitalCheckout,
);
router.post(
  '/cashCheckout',
  verifytoken_access,
  authorization(['employee', 'owner']),
  checkoutController.cashCheckout,
);

export default router;
