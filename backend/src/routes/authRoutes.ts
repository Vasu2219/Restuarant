import express from 'express';
import { registerUser, approveRestaurantOwner, getPendingRestaurantOwners } from '../controllers/authController';
import { authMiddleware, checkRole } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', registerUser);

// Protected routes
router.get('/pending-owners', authMiddleware, checkRole(['admin']), getPendingRestaurantOwners);
router.post('/approve-owner/:uid', authMiddleware, checkRole(['admin']), approveRestaurantOwner);

export default router; 