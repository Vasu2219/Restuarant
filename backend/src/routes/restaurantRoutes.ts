import express from 'express';
import {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addReview
} from '../controllers/restaurantController';
import { authMiddleware, checkRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// Public routes
router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);

// Protected routes
router.post('/', authMiddleware, checkRole(['restaurant_owner']), createRestaurant);
router.put('/:id', authMiddleware, checkRole(['restaurant_owner']), updateRestaurant);
router.post('/:id/menu', authMiddleware, checkRole(['restaurant_owner']), upload.single('image'), addMenuItem);
router.put('/:id/menu/:itemId', authMiddleware, checkRole(['restaurant_owner']), upload.single('image'), updateMenuItem);
router.delete('/:id/menu/:itemId', authMiddleware, checkRole(['restaurant_owner']), deleteMenuItem);
router.post('/:id/reviews', authMiddleware, checkRole(['customer']), addReview);

export default router; 