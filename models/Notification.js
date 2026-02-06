import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: [
        'order_placed',          
        'order_confirmed',       
        'order_preparing',       
        'order_ready',           
        'order_picked_up',       
        'order_out_for_delivery',
        'order_delivered',       
        'order_cancelled',       
        'payment_success',    
        'payment_failed'
      ],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    relatedRestaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant'
    },
    
    data: mongoose.Schema.Types.Mixed,
    
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: Date,
    
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    
    actionUrl: String
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;