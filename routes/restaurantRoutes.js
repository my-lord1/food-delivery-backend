import express from 'express';
import multer from 'multer';
import { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant, toggleAcceptingOrders, getRestaurantStats } from '../controllers/restaurantController.js';
import { getRestaurantOrders } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getRestaurants);
router.get('/:id', getRestaurant);
router.post('/', protect, authorize('restaurant_owner'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 5 }
  ]),
  createRestaurant
);

router.put('/:id', protect, authorize('restaurant_owner'),
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 5 }
  ]),
  updateRestaurant
);
router.delete('/:id', protect, authorize('restaurant_owner'), deleteRestaurant);
router.patch('/:id/toggle-orders', protect, authorize('restaurant_owner'), toggleAcceptingOrders);
router.get('/:id/stats', protect, authorize('restaurant_owner'), getRestaurantStats);
router.get('/:restaurantId/orders', protect, authorize('restaurant_owner'), getRestaurantOrders);

export default router;
