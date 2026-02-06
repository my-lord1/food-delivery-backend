import express from 'express';
import { getMenuItems, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability, getMenuCategories } from '../controllers/menuController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router({ mergeParams: true });

router.get('/', getMenuItems);
router.get('/categories', getMenuCategories);
router.get('/:id', getMenuItem);
router.post('/', protect, authorize('restaurant_owner'), uploadSingle, createMenuItem );
router.put( '/:id', protect, authorize('restaurant_owner'), uploadSingle, updateMenuItem );
router.delete('/:id', protect, authorize('restaurant_owner'), deleteMenuItem);
router.patch('/:id/toggle-availability', protect, authorize('restaurant_owner'), toggleAvailability );

export default router;
