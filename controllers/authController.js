import User from '../models/User.js';
import { sendTokenResponse, sendTokenRedirect } from '../utils/tokenUtils.js';

// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      // EXCLUSIVE CHECK: If they are a Google user, tell them to use Google
      if (existingUser.authProvider === 'google') {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered with Google. Please login with Google.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'customer',
      authProvider: 'local' // Explicitly set local
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // EXCLUSIVE CHECK: Block Google users from using password login
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please login with Google.'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/google/callback
export const googleCallback = (req, res) => {
  // If passport returned 'false' (because of our check in passport.js), req.user will be undefined
  // We should not reach here if the route handles the redirect properly, but as a fallback:
  if (!req.user) {
    const frontendURL = process.env.FRONTEND_URL;
    return res.redirect(`${frontendURL}/login?error=account_exists_local`);
  }

  sendTokenRedirect(req.user, res);
};

// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('favoriteRestaurants', 'name cuisineType averageRating images')
      .populate('favoriteMenuItems.restaurant', 'name')
      .populate('favoriteMenuItems.menuItem', 'name price image');
      
    if (!user) {
       return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      avatar: req.body.avatar
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/auth/update-password
export const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Google users don't have passwords to update
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'Google accounts cannot change password here.'
      });
    }

    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/addresses
export const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.unshift(req.body);
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/auth/addresses/:addressId
export const updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === req.params.addressId);

    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    user.addresses[addressIndex] = { ...user.addresses[addressIndex].toObject(), ...req.body };
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/auth/addresses/:addressId
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.addressId);
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};