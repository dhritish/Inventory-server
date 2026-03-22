import express from 'express';
import { verifytoken_access } from '../middleware/auth_middleware.mjs';
import * as inventoryController from '../controllers/inventoryController.mjs';

const router = express.Router();

router.post('/addItem', verifytoken_access, inventoryController.addItem);
router.get('/getItemName', verifytoken_access, inventoryController.getItemName);
router.get(
  '/getItemInformation',
  verifytoken_access,
  inventoryController.getItemInformation,
);
router.get(
  '/getSearchedItem',
  verifytoken_access,
  inventoryController.getSearchedItem,
);

export default router;
