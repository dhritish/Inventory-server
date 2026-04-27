import express from 'express';
import { verifytoken_access } from '../middleware/auth_middleware.mjs';
import * as cartController from './cartController.mjs';

const router = express.Router();

router.patch('/addToCart', verifytoken_access, cartController.addToCart);
router.get('/getCart', verifytoken_access, cartController.getCart);
router.patch(
  '/decreaseFromCart',
  verifytoken_access,
  cartController.decreaseFromCart,
);
router.patch(
  '/removeFromCart',
  verifytoken_access,
  cartController.removeFromCart,
);

export default router;
