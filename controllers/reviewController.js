import Review from '../models/Review.js';
import Restaurant from '../models/Restaurant.js';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import { uploadMultipleToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUtils.js';
import { notifyUser, notificationTemplates } from '../utils/notificationUtils.js';


// @route   POST /api/reviews
export const createReview = async (req, res, next) => {
  try {
    const { restaurantId, orderId, ratings, comment } = req.body;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this order'
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Can only review delivered orders'
      });
    }

    if (order.isReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this order'
      });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadMultipleToCloudinary(req.files, 'reviews');
    }

    const review = await Review.create({
      customer: req.user.id,
      restaurant: restaurantId,
      order: orderId,
      ratings,
      comment,
      images
    });

    order.isReviewed = true;
    await order.save();
    await updateRestaurantRating(restaurantId);

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/restaurants/:restaurantId/reviews
export const getRestaurantReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'recent' } = req.query;

    const query = {
      restaurant: req.params.restaurantId,
      moderationStatus: 'approved'
    };

    let sort = '-createdAt';
    if (sortBy === 'rating_high') sort = '-ratings.overall';
    if (sortBy === 'rating_low') sort = 'ratings.overall';
    if (sortBy === 'helpful') sort = '-helpfulCount';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(query)
      .populate('customer', 'name avatar')
      .populate('restaurantResponse.respondedBy', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Review.countDocuments(query);

    const ratingDistribution = await Review.aggregate([
      { $match: { restaurant: req.params.restaurantId, moderationStatus: 'approved' } },
      {
        $group: {
          _id: '$ratings.overall',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      ratingDistribution,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/reviews/:id
export const getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('customer', 'name avatar')
      .populate('restaurant', 'name')
      .populate('restaurantResponse.respondedBy', 'name');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/reviews/:id
export const updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    review.ratings = req.body.ratings || review.ratings;
    review.comment = req.body.comment || review.comment;
    review.isEdited = true;
    review.editedAt = new Date();

    review.moderationStatus = 'pending';
    review.moderationFlags = [];

    await review.save();

    await updateRestaurantRating(review.restaurant);

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/reviews/:id
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    if (review.images && review.images.length > 0) {
      for (const image of review.images) {
        if (image.public_id) {
          await deleteFromCloudinary(image.public_id);
        }
      }
    }

    const restaurantId = review.restaurant;
    await review.deleteOne();

    await updateRestaurantRating(restaurantId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/reviews/:id/respond
export const respondToReview = async (req, res, next) => {
  try {
    const { response } = req.body;

    const review = await Review.findById(req.params.id).populate('restaurant customer');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this review'
      });
    }

    if (review.moderationStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot respond to unapproved reviews'
      });
    }

    review.restaurantResponse = {
      text: response,
      respondedAt: new Date(),
      respondedBy: req.user.id
    };

    await review.save();

    if (req.io) {
      await notifyUser(req.io, {
        recipient: review.customer._id,
        relatedRestaurant: review.restaurant._id,
        ...notificationTemplates.restaurantResponse(review.restaurant.name)
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/reviews/:id/helpful
export const markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const alreadyMarked = review.markedHelpfulBy.includes(req.user.id);

    if (alreadyMarked) {
      review.markedHelpfulBy = review.markedHelpfulBy.filter(
        id => id.toString() !== req.user.id
      );
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      review.markedHelpfulBy.push(req.user.id);
      review.helpfulCount += 1;
    }

    await review.save();

    res.status(200).json({
      success: true,
      data: {
        helpfulCount: review.helpfulCount,
        isMarkedHelpful: !alreadyMarked
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/reviews/restaurant/:restaurantId/dashboard
export const getOwnerReviews = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    
    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { page = 1, limit = 20 } = req.query;
    const query = { restaurant: req.params.restaurantId };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(query)
      .populate('customer', 'name avatar')
      .populate('order', 'orderNumber') 
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Review.countDocuments(query);
    const totalReviews = await Review.countDocuments({ restaurant: req.params.restaurantId });
    const pendingReviews = await Review.countDocuments({ restaurant: req.params.restaurantId, moderationStatus: 'pending' });
    const agg = await Review.aggregate([
      { $match: { restaurant: restaurant._id } },
      { $group: { _id: null, avg: { $avg: '$ratings.overall' } } }
    ]);
    const averageRating = agg.length > 0 ? agg[0].avg.toFixed(1) : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      stats: {
        totalReviews,
        pendingReviews,
        averageRating
      },
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};


export const getReviewByOrder = async (req, res, next) => {
  try {
    const review = await Review.findOne({ order: req.params.orderId })
      .populate('restaurant', 'name images')
      .populate('restaurantResponse.respondedBy', 'name');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

const updateRestaurantRating = async (restaurantId) => {
  const result = await Review.aggregate([
    {
      $match: {
        restaurant: restaurantId,
        moderationStatus: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$ratings.overall' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (result.length > 0) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews
    });
  } else {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      averageRating: 0,
      totalReviews: 0
    });
  }
};
