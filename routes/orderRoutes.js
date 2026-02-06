import express from 'express';
import { body } from 'express-validator';
import { createOrder, verifyPayment, getOrders, getOrder, updateOrderStatus, cancelOrder, trackOrder } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const createOrderValidation = [
  body('restaurantId').notEmpty().withMessage('Restaurant ID is required'),
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
  body('contactNumber')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('paymentMethod')
    .isIn(['razorpay', 'cash_on_delivery'])
    .withMessage('Invalid payment method')
];

router.post('/', protect, createOrderValidation, validate, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.get('/', protect, getOrders);
router.get('/:id', protect, getOrder);
router.get('/:id/track', protect, trackOrder);
router.patch('/:id/status', protect, authorize('restaurant_owner'), updateOrderStatus);
router.patch('/:id/cancel', protect, cancelOrder);

export default router;
