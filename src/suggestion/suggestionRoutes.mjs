import express from 'express';
import {
  authorization,
  verifytoken_access,
} from '../middleware/auth_middleware.mjs';
import * as suggestionController from './suggestionController.mjs';

const router = express.Router();

router.get(
  '/trending',
  verifytoken_access,
  authorization(['owner', 'employee', 'customer']),
  suggestionController.getTrending,
);

export default router;
