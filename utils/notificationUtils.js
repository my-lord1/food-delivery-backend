import Notification from '../models/Notification.js';

export const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

export const sendRealTimeNotification = (io, userId, notification) => {
  io.to(userId.toString()).emit('notification', notification);
};

export const notifyUser = async (io, data) => {
  const notification = await createNotification(data);
  if (notification) {
    sendRealTimeNotification(io, data.recipient, notification);
  }
  return notification;
};

export const notificationTemplates = {
  orderPlaced: (orderNumber) => ({
    type: 'order_placed',
    title: 'Order Placed Successfully!',
    message: `Your order #${orderNumber} has been placed successfully.`,
    priority: 'high'
  }),
  
  orderConfirmed: (orderNumber) => ({
    type: 'order_confirmed',
    title: 'Order Confirmed',
    message: `Restaurant has confirmed your order #${orderNumber}.`,
    priority: 'high'
  }),
  
  orderPreparing: (orderNumber, estimatedTime) => ({
    type: 'order_preparing',
    title: 'Your Food is Being Prepared',
    message: `Your order #${orderNumber} is being prepared. Estimated time: ${estimatedTime}.`,
    priority: 'medium'
  }),
  
  orderReady: (orderNumber) => ({
    type: 'order_ready',
    title: 'Order Ready for Pickup',
    message: `Your order #${orderNumber} is ready and will be picked up soon.`,
    priority: 'high'
  }),
  
  orderOutForDelivery: (orderNumber, estimatedTime) => ({
    type: 'order_out_for_delivery',
    title: 'Order Out for Delivery',
    message: `Your order #${orderNumber} is out for delivery. Will arrive in ${estimatedTime}.`,
    priority: 'high'
  }),
  
  orderDelivered: (orderNumber) => ({
    type: 'order_delivered',
    title: 'Order Delivered',
    message: `Your order #${orderNumber} has been delivered. Enjoy your meal!`,
    priority: 'medium'
  }),
  
  orderCancelled: (orderNumber, reason) => ({
    type: 'order_cancelled',
    title: 'Order Cancelled',
    message: `Your order #${orderNumber} has been cancelled. ${reason}`,
    priority: 'high'
  }),
  
  paymentSuccess: (orderNumber, amount) => ({
    type: 'payment_success',
    title: 'Payment Successful',
    message: `Payment of ₹${amount} for order #${orderNumber} was successful.`,
    priority: 'high'
  }),
  
  paymentFailed: (orderNumber) => ({
    type: 'payment_failed',
    title: 'Payment Failed',
    message: `Payment for order #${orderNumber} failed. Please try again.`,
    priority: 'high'
  }),
  
  reviewRequest: (orderNumber, restaurantName) => ({
    type: 'review_request',
    title: 'Rate Your Order',
    message: `How was your experience with ${restaurantName}? Share your feedback!`,
    priority: 'low'
  }),
  
  restaurantResponse: (restaurantName) => ({
    type: 'restaurant_response',
    title: 'Restaurant Responded',
    message: `${restaurantName} has responded to your review.`,
    priority: 'medium'
  })
};