import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import { uploadToCloudinary, uploadMultipleToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUtils.js';

// @route   GET /api/restaurants
export const getRestaurants = async (req, res, next) => {
  try {
    const {
      search,
      cuisineType,
      priceRange,
      rating,
      city,
      isVeg,
      sortBy,
      page = 1,
      limit = 12
    } = req.query;

    let query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (cuisineType) {
      query.cuisineType = { $in: cuisineType.split(',') };
    }

    if (priceRange) {
      query.priceRange = { $in: priceRange.split(',') };
    }

    if (rating) {
      query.averageRating = { $gte: parseFloat(rating) };
    }

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    if (isVeg === 'true') {
      query.isPureVeg = true;
    }

    let sort = '-createdAt';
    if (sortBy === 'rating') sort = '-averageRating';
    if (sortBy === 'delivery_time') sort = 'deliveryTime';
    if (sortBy === 'price_low') sort = 'priceRange';
    if (sortBy === 'price_high') sort = '-priceRange';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const restaurants = await Restaurant.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .select('-__v');

    const total = await Restaurant.countDocuments(query);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: restaurants
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/restaurants/:id
export const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate(
      'owner',
      'name email phone'
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/restaurants
export const createRestaurant = async (req, res, next) => {
  try {
    const existingRestaurant = await Restaurant.findOne({ owner: req.user.id });
    
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: 'You already have a restaurant registered'
      });
    }

    req.body.owner = req.user.id;

    if (req.files) {
      if (req.files.coverImage) {
        const coverImageResult = await uploadToCloudinary(
          req.files.coverImage[0].buffer,
          'restaurants/cover'
        );
        req.body.coverImage = coverImageResult;
      }

      if (req.files.images) {
        const imagesResults = await uploadMultipleToCloudinary(
          req.files.images,
          'restaurants/gallery'
        );
        req.body.images = imagesResults;
      }
    }

    const restaurant = await Restaurant.create(req.body);
    req.user.restaurant = restaurant._id;
    await req.user.save();

    res.status(201).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/restaurants/:id)
export const updateRestaurant = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    if (req.files) {
      if (req.files.coverImage) {
        if (restaurant.coverImage?.public_id) {
          await deleteFromCloudinary(restaurant.coverImage.public_id);
        }
        const coverImageResult = await uploadToCloudinary(
          req.files.coverImage[0].buffer,
          'restaurants/cover'
        );
        req.body.coverImage = coverImageResult;
      }

      if (req.files.images) {
        const imagesResults = await uploadMultipleToCloudinary(
          req.files.images,
          'restaurants/gallery'
        );
        req.body.images = [...(restaurant.images || []), ...imagesResults];
      }
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/restaurants/:id
export const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this restaurant'
      });
    }

    await MenuItem.deleteMany({ restaurant: restaurant._id });

    if (restaurant.coverImage?.public_id) {
      await deleteFromCloudinary(restaurant.coverImage.public_id);
    }
    if (restaurant.images?.length > 0) {
      for (const image of restaurant.images) {
        if (image.public_id) {
          await deleteFromCloudinary(image.public_id);
        }
      }
    }

    await restaurant.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/restaurants/:id/toggle-orders
export const toggleAcceptingOrders = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    restaurant.isAcceptingOrders = !restaurant.isAcceptingOrders;
    await restaurant.save();

    res.status(200).json({
      success: true,
      data: {
        isAcceptingOrders: restaurant.isAcceptingOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/restaurants/:id/stats
export const getRestaurantStats = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const menuItemsCount = await MenuItem.countDocuments({
      restaurant: restaurant._id
    });

    res.status(200).json({
      success: true,
      data: {
        totalOrders: restaurant.totalOrders,
        averageRating: restaurant.averageRating,
        totalReviews: restaurant.totalReviews,
        menuItemsCount
      }
    });
  } catch (error) {
    next(error);
  }
};
