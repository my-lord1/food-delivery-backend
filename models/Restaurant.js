import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Please provide restaurant name'],
      trim: true,
      maxlength: [100, 'Restaurant name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide restaurant description'],
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    cuisineType: [
      {
        type: String,
        required: true,
        enum: [
          'North Indian',
          'South Indian',
          'Chinese',
          'Continental',
          'Italian',
          'Mexican',
          'Fast Food',
          'Desserts',
          'Beverages',
          'Biryani',
          'Street Food',
          'Healthy',
          'Bakery',
          'Seafood',
          'Bengali',
          'Punjabi',
          'Mughlai',
          'Tandoor',
          'Pizza',
          'Burger',
          'Salads',
          'Other',
          'Snacks'
        ]
      }
    ],
    images: [
      {
        url: String,
        public_id: String
      }
    ],
    coverImage: {
      url: String,
      public_id: String
    },
    location: {
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
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0]
        }
      }
    },
    contact: {
      phone: {
        type: String,
        required: true,
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
      },
      email: {
        type: String,
        required: true,
        lowercase: true
      }
    },
    operatingHours: {
      monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
      sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } }
    },
    priceRange: {
      type: String,
      enum: ['₹', '₹₹', '₹₹₹', '₹₹₹₹'],
      required: true
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    deliveryTime: {
      type: String,
      default: '30-40 mins'
    },
    minimumOrder: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    isAcceptingOrders: {
      type: Boolean,
      default: true
    },
    isPureVeg: {
      type: Boolean,
      default: false
    },
    features: [
      {
        type: String,
        enum: [
          'Free Delivery',
          'Contactless Delivery',
          'Live Tracking',
          'Fast Delivery',
          'Table Booking',
          'Outdoor Seating',
          'Home Delivery',
          'Takeaway',
          'Pure Veg',
          'Serves Alcohol'
        ]
      }
    ],
    popularDishes: [String],
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    totalOrders: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

restaurantSchema.index({ 'location.coordinates': '2dsphere' });
restaurantSchema.index({ name: 'text', description: 'text' });
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

export default Restaurant;