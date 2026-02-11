import express from 'express';
import { body } from 'express-validator';
import passport from 'passport';
import { register, login, googleCallback, getMe, updateProfile, updatePassword, logout, addAddress, updateAddress, deleteAddress } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { forgotPassword, resetPassword } from '../controllers/authController.js';
const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('role').optional().isIn(['customer', 'restaurant_owner'])
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/update-password', protect, updatePasswordValidation, validate, updatePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.get('/google', (req, res, next) => {
    const { role } = req.query;
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      state: role 
    })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) { 
      return next(err); 
    }
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_exists_local`);
    }

    req.logIn(user, (err) => {
      if (err) { return next(err); }
      return googleCallback(req, res, next);
    });
  })(req, res, next);
});

router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

export default router;