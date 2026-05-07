import express from 'express';
import {
  authorization,
  verifytoken_access,
  verifytoken_refresh,
} from '../middleware/auth_middleware.mjs';
import * as orderController from './orderController.mjs';

const router = express.Router();

router.get(
  '/notDelivered',
  verifytoken_access,
  authorization(['owner', 'employee', 'customer']),
  orderController.getNotDeliveredItems,
);

router.get(
  '/delivered',
  verifytoken_access,
  authorization(['owner', 'employee', 'customer']),
  orderController.getDeliveredItems,
);

router.patch(
  '/cancel',
  verifytoken_access,
  authorization(['owner', 'employee', 'customer']),
  orderController.cancelOrder,
);

router.get(
  '/orderWithStatus',
  verifytoken_access,
  authorization(['owner', 'employee']),
  orderController.getOrders,
);

router.patch(
  '/updateOrder',
  verifytoken_access,
  authorization(['owner', 'employee']),
  orderController.updateOrder,
);

router.patch(
  '/updateManyOrder',
  verifytoken_access,
  authorization(['owner', 'employee']),
  orderController.updateManyOrder,
);

router.get(
  '/orderInfo',
  verifytoken_access,
  authorization(['owner', 'employee']),
  orderController.getOrdersInfo,
);

router.get(
  '/yourDelivery',
  verifytoken_access,
  authorization(['owner', 'employee']),
  orderController.getYourDelivery,
);

router.patch(
  '/calculatePath',
  verifytoken_access,
  authorization(['owner', 'employee']),
  orderController.calculatePath,
);

export default router;
