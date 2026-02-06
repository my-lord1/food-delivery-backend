import express from 'express';
import { body } from 'express-validator';
import { createReview, getRestaurantReviews, getReview, updateReview, deleteReview, respondToReview, markHelpful, getOwnerReviews, getReviewByOrder } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

const createReviewValidation = [
  body('restaurantId').notEmpty().withMessage('Restaurant ID is required'),
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('ratings.food').isInt({ min: 1, max: 5 }).withMessage('Food rating must be between 1 and 5'),
  body('ratings.delivery').isInt({ min: 1, max: 5 }).withMessage('Delivery rating must be between 1 and 5'),
  body('ratings.overall').isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('comment')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Comment must be between 10 and 500 characters')
];

router.post('/', protect, uploadMultiple, createReviewValidation, validate, createReview);
router.get('/restaurant/:restaurantId', getRestaurantReviews);
router.get('/:id', getReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/respond', protect, authorize('restaurant_owner'), respondToReview);
router.post('/:id/helpful', protect, markHelpful);
router.get('/restaurant/:restaurantId/dashboard', protect, authorize('restaurant_owner'), getOwnerReviews);
router.get('/restaurant/:restaurantId', getRestaurantReviews);
router.get('/order/:orderId', protect, getReviewByOrder);
export default router;
