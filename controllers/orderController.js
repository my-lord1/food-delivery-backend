import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import User from '../models/User.js';
import razorpayInstance from '../config/razorpay.js';
import crypto from 'crypto';
import { notifyUser, notificationTemplates } from '../utils/notificationUtils.js';

// @route   POST /api/orders
export const createOrder = async (req, res, next) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      deliveryType,
      scheduledFor,
      contactNumber,
      specialInstructions,
      paymentMethod
    } = req.body;

    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const generatedOrderNumber = `ORD${timestamp}${random}`;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    if (!restaurant.isAcceptingOrders) {
      return res.status(400).json({ success: false, message: 'Restaurant is not accepting orders at the moment' });
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item ${item.menuItem} not found` });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: `${menuItem.name} is currently unavailable` });
      }

      let itemTotal = menuItem.price * item.quantity;

      if (item.customizations && item.customizations.length > 0) {
        item.customizations.forEach(custom => {
          itemTotal += custom.price * item.quantity;
        });
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions,
        itemTotal
      });

      subtotal += itemTotal;
    }

    const deliveryFee = restaurant.deliveryFee || 0;
    const taxRate = 0.05; // 5% GST
    const tax = subtotal * taxRate;
    const total = subtotal + deliveryFee + tax;

    if (subtotal < restaurant.minimumOrder) {
      return res.status(400).json({ success: false, message: `Minimum order amount is ₹${restaurant.minimumOrder}` });
    }

    const orderData = {
      orderNumber: generatedOrderNumber,
      customer: req.user.id,
      restaurant: restaurantId,
      items: orderItems,
      deliveryAddress,
      pricing: { subtotal, deliveryFee, tax, total },
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending'
      },
      deliveryType,
      scheduledFor,
      contactNumber: contactNumber || '9999999999',
      specialInstructions,
      estimatedDeliveryTime: new Date(Date.now() + 40 * 60000) 
    };

    const order = await Order.create(orderData);

    if (paymentMethod === 'razorpay') {
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(total * 100),
        currency: 'INR',
        receipt: generatedOrderNumber,
        notes: { orderId: order._id.toString(), customerId: req.user.id.toString() }
      });

      order.payment.razorpayOrderId = razorpayOrder.id;
      await order.save();

      return res.status(201).json({
        success: true,
        data: {
          order,
          razorpayOrder: {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
          }
        }
      });
    }

    if (req.io) {
      await notifyUser(req.io, {
        recipient: req.user.id,
        relatedOrder: order._id,
        ...notificationTemplates.orderPlaced(order.orderNumber)
      });
      
      req.io.to(restaurantId).emit('new_order', order);
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/orders/verify-payment
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      order.payment.status = 'failed';
      await order.save();
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    order.payment.status = 'completed';
    order.payment.razorpayPaymentId = razorpayPaymentId;
    order.payment.razorpaySignature = razorpaySignature;
    order.payment.paidAt = new Date();
    order.payment.transactionId = razorpayPaymentId;
    order.status = 'confirmed'; 
    
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Payment successful via Razorpay'
    });
    
    await order.save();

    if (req.io) {
      await notifyUser(req.io, {
        recipient: req.user.id,
        relatedOrder: order._id,
        ...notificationTemplates.paymentSuccess(order.orderNumber, order.pricing.total)
      });
      req.io.to(order.restaurant.toString()).emit('new_order', order);
    }

    res.status(200).json({ success: true, message: 'Payment verified', data: order });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/orders
export const getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let query = { customer: req.user.id };

    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .populate('restaurant', 'name location images cuisineType')
      .populate('items.menuItem', 'name image')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

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

// @route   GET /api/orders/:id
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name location contact images cuisineType')
      .populate('items.menuItem', 'name image description')
      .populate('customer', 'name email phone');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (
      order.customer._id.toString() !== req.user.id &&
      order.restaurant.owner?.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/restaurants/:restaurantId/orders
export const getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    if (restaurant.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const { status, page = 1, limit = 50 } = req.query;
    let query = { restaurant: req.params.restaurantId };

    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('customer', 'name phone email')
      .populate('items.menuItem', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate('restaurant customer');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.restaurant.owner.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    order.status = status;

    const phaseMap = {
      placed: 'order_placed',
      confirmed: 'order_placed',
      preparing: 'restaurant_preparing',
      ready: 'food_ready',
      picked_up: 'out_for_delivery', 
      out_for_delivery: 'out_for_delivery',
      delivered: 'delivered',
      cancelled: 'cancelled'
    };
    
    order.deliveryPhase = phaseMap[status] || order.deliveryPhase;

    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      if (order.payment.method === 'cash_on_delivery') {
        order.payment.status = 'completed';
      }
    }

    await order.save();

    if (req.io) {
      const notificationMap = {
        confirmed: notificationTemplates.orderConfirmed,
        preparing: notificationTemplates.orderPreparing,
        ready: notificationTemplates.orderReady,
        picked_up: notificationTemplates.orderOutForDelivery,
        out_for_delivery: notificationTemplates.orderOutForDelivery,
        delivered: notificationTemplates.orderDelivered,
        cancelled: notificationTemplates.orderCancelled
      };

      if (notificationMap[status]) {
        let template;
        if (status === 'preparing') {
          template = notificationMap[status](order.orderNumber, '30-40 mins');
        } else if (status === 'picked_up' || status === 'out_for_delivery') {
          template = notificationMap[status](order.orderNumber, '15-20 mins');
        } else if (status === 'cancelled') {
           template = notificationMap[status](order.orderNumber, 'Restaurant declined');
        } else {
          template = notificationMap[status](order.orderNumber);
        }

        await notifyUser(req.io, {
          recipient: order.customer._id,
          relatedOrder: order._id,
          ...template
        });
      }

      req.io.to(order.customer._id.toString()).emit('order_status_update', {
        orderId: order._id,
        status: order.status,
        deliveryPhase: order.deliveryPhase
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/orders/:id/cancel
export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id).populate('restaurant customer');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isCustomer = order.customer._id.toString() === req.user.id;
    const isRestaurant = order.restaurant.owner?.toString() === req.user.id;

    if (!isCustomer && !isRestaurant) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (['delivered', 'cancelled'].includes(order.status)) return res.status(400).json({ success: false, message: 'Cannot cancel' });

    order.status = 'cancelled';
    order.cancellation = {
      isCancelled: true,
      cancelledBy: isCustomer ? 'customer' : 'restaurant',
      reason,
      cancelledAt: new Date()
    };

    await order.save();

    if (req.io) {
      await notifyUser(req.io, {
        recipient: order.customer._id,
        relatedOrder: order._id,
        ...notificationTemplates.orderCancelled(order.orderNumber, reason || 'No reason provided')
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/orders/:id/track
export const trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('orderNumber status deliveryPhase statusHistory estimatedDeliveryTime actualDeliveryTime')
      .populate('restaurant', 'name location contact');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.customer?.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};