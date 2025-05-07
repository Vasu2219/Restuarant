import express from 'express';
import {
  createOrder,
  getOrders,
  updateOrderStatus,
  updateOrderTracking
} from '../controllers/orderController';
import { authMiddleware, checkRole } from '../middleware/auth';

const router = express.Router();

// Protected routes
router.post('/', authMiddleware, checkRole(['customer']), createOrder);
router.get('/', authMiddleware, getOrders);
router.put('/:id/status', authMiddleware, updateOrderStatus);
router.put('/:id/tracking', authMiddleware, checkRole(['restaurant_owner']), updateOrderTracking);

export default router; 