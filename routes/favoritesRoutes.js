import express from 'express';
import {
  toggleFavoriteRestaurant,
  getFavoriteRestaurants,
  toggleFavoriteMenuItem,
  getFavoriteMenuItems
} from '../controllers/favoritesController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/restaurants/:restaurantId', protect, toggleFavoriteRestaurant);
router.get('/restaurants', protect, getFavoriteRestaurants);
router.post('/menu-items/:menuItemId', protect, toggleFavoriteMenuItem);
router.get('/menu-items', protect, getFavoriteMenuItems);

export default router;
