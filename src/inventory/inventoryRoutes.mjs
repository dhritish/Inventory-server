import express from 'express';
import {
  authorization,
  verifytoken_access,
} from '../middleware/auth_middleware.mjs';
import * as inventoryController from './inventoryController.mjs';

const router = express.Router();

router.post(
  '/addItem',
  verifytoken_access,
  authorization(['owner', 'employee']),
  inventoryController.addItem,
);
router.get(
  '/getItemName',
  verifytoken_access,
  authorization(['owner', 'employee']),
  inventoryController.getItemName,
);
router.get(
  '/getItemInformation',
  verifytoken_access,
  authorization(['owner', 'employee']),
  inventoryController.getItemInformation,
);
router.get(
  '/getSearchedItem',
  verifytoken_access,
  authorization(['owner', 'employee', 'customer']),
  inventoryController.getSearchedItem,
);

export default router;
