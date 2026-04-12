import express from 'express';
import { verifytoken_access } from '../middleware/auth_middleware.mjs';
import * as analyticsController from './analyticsController.mjs';

const router = express.Router();

router.get(
  '/getRecentTransactions',
  verifytoken_access,
  analyticsController.getRecentTransactions,
);
router.get(
  '/getGraphData',
  verifytoken_access,
  analyticsController.getGraphData,
);
router.get(
  '/getCategories',
  verifytoken_access,
  analyticsController.getCategories,
);
router.get(
  '/getCategoryWiseSales',
  verifytoken_access,
  analyticsController.getCategoryWiseSales,
);
router.get('/report', verifytoken_access, analyticsController.getReport);

export default router;
