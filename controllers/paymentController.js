import User from '../models/User.js';
import Order from '../models/Order.js';

// @route   POST /api/payments/save-method
export const savePaymentMethod = async (req, res, next) => {
  try {
    const { tokenId, cardLast4, cardBrand, cardNetwork, isDefault } = req.body;
    const user = await User.findById(req.user.id);

    if (isDefault) {
      user.savedPaymentMethods.forEach(method => {
        method.isDefault = false;
      });
    }

    user.savedPaymentMethods.push({
      tokenId,
      cardLast4,
      cardBrand,
      cardNetwork,
      isDefault: isDefault || user.savedPaymentMethods.length === 0
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: user.savedPaymentMethods
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/payments/saved-methods
export const getSavedPaymentMethods = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('savedPaymentMethods');

    res.status(200).json({
      success: true,
      data: user.savedPaymentMethods
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/payments/saved-methods/:methodId
export const deletePaymentMethod = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    user.savedPaymentMethods = user.savedPaymentMethods.filter(
      method => method._id.toString() !== req.params.methodId
    );

    const hasDefault = user.savedPaymentMethods.some(method => method.isDefault);
    if (!hasDefault && user.savedPaymentMethods.length > 0) {
      user.savedPaymentMethods[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user.savedPaymentMethods
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/payments/saved-methods/:methodId/set-default
export const setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    user.savedPaymentMethods.forEach(method => {
      method.isDefault = false;
    });

    const method = user.savedPaymentMethods.id(req.params.methodId);
    if (!method) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }

    method.isDefault = true;
    await user.save();

    res.status(200).json({
      success: true,
      data: user.savedPaymentMethods
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/payments/history
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find({
      customer: req.user.id,
      'payment.status': 'completed'
    })
      .select('orderNumber createdAt pricing payment restaurant')
      .populate('restaurant', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments({
      customer: req.user.id,
      'payment.status': 'completed'
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/payments/receipt/:orderId
export const getPaymentReceipt = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('customer', 'name email')
      .populate('restaurant', 'name location contact');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (order.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed for this order'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        customer: order.customer,
        restaurant: order.restaurant,
        items: order.items,
        pricing: order.pricing,
        payment: {
          method: order.payment.method,
          transactionId: order.payment.transactionId,
          paidAt: order.payment.paidAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
