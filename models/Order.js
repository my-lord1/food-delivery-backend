import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: true
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true
        },
        customizations: [
          {
            name: String,
            option: String,
            price: Number
          }
        ],
        specialInstructions: String,
        itemTotal: {
          type: Number,
          required: true
        }
      }
    ],
    deliveryAddress: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      pincode: {
        type: String,
        required: true
      },
      landmark: String,
      coordinates: {
        type: [Number], 
        default: [0, 0]
      }
    },
    pricing: {
      subtotal: {
        type: Number,
        required: true
      },
      deliveryFee: {
        type: Number,
        default: 0
      },
      tax: {
        type: Number,
        default: 0
      },
      discount: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        required: true
      }
    },
    payment: {
      method: {
        type: String,
        enum: ['razorpay', 'cash_on_delivery'],
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
      },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      transactionId: String,
      paidAt: Date
    },
    deliveryType: {
      type: String,
      enum: ['immediate', 'scheduled'],
      default: 'immediate'
    },
    scheduledFor: {
      date: Date,
      timeSlot: {
        start: String,
        end: String
      }
    },
    status: {
      type: String,
      enum: [
        'placed',
        'confirmed',
        'preparing',
        'ready',
        'picked_up',
        'out_for_delivery',
        'delivered',
        'cancelled'
      ],
      default: 'placed'
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        note: String
      }
    ],
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    deliveryPhase: {
      type: String,
      enum: [
        'order_placed',
        'restaurant_preparing',
        'food_ready',
        'out_for_delivery',
        'nearby',
        'delivered'
      ],
      default: 'order_placed'
    },
    specialInstructions: String,
    contactNumber: {
      type: String
    },
    cancellation: {
      isCancelled: {
        type: Boolean,
        default: false
      },
      cancelledBy: {
        type: String,
        enum: ['customer', 'restaurant', 'system']
      },
      reason: String,
      cancelledAt: Date
    },
    restaurantNotes: String,
    isReviewed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  next();
});

orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;