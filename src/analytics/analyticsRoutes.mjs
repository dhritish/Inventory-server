import express from 'express';
import {
  authorization,
  verifytoken_access,
} from '../middleware/auth_middleware.mjs';
import * as analyticsController from './analyticsController.mjs';

const router = express.Router();

router.get(
  '/getRecentTransactions',
  verifytoken_access,
  authorization(['employee', 'owner']),
  analyticsController.getRecentTransactions,
);
router.get(
  '/getGraphData',
  verifytoken_access,
  authorization(['employee', 'owner']),
  analyticsController.getGraphData,
);
router.get(
  '/getCategories',
  verifytoken_access,
  authorization(['employee', 'owner']),
  analyticsController.getCategories,
);
router.get(
  '/getCategoryWiseSales',
  verifytoken_access,
  authorization(['employee', 'owner']),
  analyticsController.getCategoryWiseSales,
);
router.get(
  '/report',
  verifytoken_access,
  authorization(['owner', 'employee']),
  analyticsController.getReport,
);

export default router;
