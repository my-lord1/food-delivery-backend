import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Please provide item name'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide item description'],
      maxlength: [300, 'Description cannot exceed 300 characters']
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Starters',
        'Main Course',
        'Breads',
        'Rice & Biryani',
        'Chinese',
        'South Indian',
        'Desserts',
        'Beverages',
        'Salads',
        'Soups',
        'Snacks',
        'Breakfast',
        'Combos',
        'Pizza',
        'Burger',
        'Sandwiches',
        'Other'
      ]
    },
    image: {
      url: String,
      public_id: String
    },
    price: {
      type: Number,
      required: [true, 'Please provide item price'],
      min: [0, 'Price cannot be negative']
    },
    discountedPrice: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    isVeg: {
      type: Boolean,
      required: true,
      default: true
    },
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'hot', 'extra-hot', 'not-applicable'],
      default: 'not-applicable'
    },
    nutritionalInfo: {
      calories: {
        type: Number,
        required: [true, 'Please provide calories information']
      },
      protein: {
        type: Number,
        required: [true, 'Please provide protein information']
      },
      carbs: {
        type: Number,
        required: [true, 'Please provide carbohydrates information']
      },
      fat: {
        type: Number,
        required: [true, 'Please provide fat information']
      },
      fiber: Number,
      sugar: Number,
      sodium: Number
    },
    allergens: [
      {
        type: String,
        enum: [
          'Dairy',
          'Eggs',
          'Gluten',
          'Nuts',
          'Soy',
          'Shellfish',
          'Fish',
          'Peanuts',
          'Sesame',
          'None'
        ]
      }
    ],
    portionSize: {
      type: String,
      default: '1 serving'
    },
    preparationTime: {
      type: Number, 
      default: 15
    },
    customizations: [
      {
        name: {
          type: String,
          required: true
        },
        options: [
          {
            name: String,
            price: {
              type: Number,
              default: 0
            }
          }
        ],
        isRequired: {
          type: Boolean,
          default: false
        },
        allowMultiple: {
          type: Boolean,
          default: false
        }
      }
    ],
    isAvailable: {
      type: Boolean,
      default: true
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isRecommended: {
      type: Boolean,
      default: false
    },
    tags: [String],
    totalOrders: {
      type: Number,
      default: 0
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
    }
  },
  {
    timestamps: true
  }
);

menuItemSchema.index({ name: 'text', description: 'text' });
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

export default MenuItem;