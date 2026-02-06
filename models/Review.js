import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
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
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    ratings: {
      food: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      delivery: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      overall: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      }
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      maxlength: [500, 'Review cannot exceed 500 characters']
    },
    images: [
      {
        url: String,
        public_id: String
      }
    ],
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'pending'
    },
    moderationFlags: [
      {
        type: String,
        enum: [
          'spam',
          'offensive_language',
          'irrelevant',
          'fake_review',
          'promotional',
          'personal_info',
          'harassment'
        ]
      }
    ],
    autoModeration: {
      score: {
        type: Number,
        default: 0
      },
      detectedIssues: [String],
      isAutoApproved: {
        type: Boolean,
        default: false
      }
    },
    restaurantResponse: {
      text: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    helpfulCount: {
      type: Number,
      default: 0
    },
    markedHelpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: true
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ restaurant: 1, moderationStatus: 1, createdAt: -1 });
reviewSchema.index({ customer: 1 });

reviewSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('comment')) {
    const comment = this.comment.toLowerCase();
    
    const offensiveWords = [
      'spam', 'fake', 'scam', 'cheat', 'worst', 'horrible', 'terrible',
      'pathetic', 'disgusting', 'shit', 'fuck', 'damn', 'idiot', 'stupid',
      'fraud', 'liar', 'click here', 'buy now', 'free', 'win', 'prize'
    ];
    
    const suspiciousPatterns = [
      /\d{10}/g, 
      /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g, 
      /https?:\/\//g, 
      /(.)\1{4,}/g 
    ];
    
    let moderationScore = 100;
    const detectedIssues = [];
    
    offensiveWords.forEach(word => {
      if (comment.includes(word)) {
        moderationScore -= 15;
        detectedIssues.push(`Contains word: ${word}`);
        this.moderationFlags.push('offensive_language');
      }
    });
    
    suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(comment)) {
        moderationScore -= 20;
        const issueTypes = ['phone number', 'email address', 'URL', 'repeated characters'];
        detectedIssues.push(`Contains ${issueTypes[index]}`);
        if (index < 3) {
          this.moderationFlags.push('personal_info');
        } else {
          this.moderationFlags.push('spam');
        }
      }
    });
    
    if (this.comment.length < 10) {
      moderationScore -= 10;
      detectedIssues.push('Too short');
      this.moderationFlags.push('spam');
    }
    
    const uppercaseRatio = (this.comment.match(/[A-Z]/g) || []).length / this.comment.length;
    if (uppercaseRatio > 0.5 && this.comment.length > 20) {
      moderationScore -= 10;
      detectedIssues.push('Excessive caps');
      this.moderationFlags.push('spam');
    }
    
    this.moderationFlags = [...new Set(this.moderationFlags)];
    this.autoModeration.score = Math.max(0, moderationScore);
    this.autoModeration.detectedIssues = detectedIssues;
    
    if (moderationScore >= 70) {
      this.moderationStatus = 'approved';
      this.autoModeration.isAutoApproved = true;
    } else if (moderationScore < 40) {
      this.moderationStatus = 'flagged';
    } else {
      this.moderationStatus = 'pending';
    }
  }
  
  next();
});

reviewSchema.index({ customer: 1, order: 1 }, { unique: true });
const Review = mongoose.model('Review', reviewSchema);

export default Review;
