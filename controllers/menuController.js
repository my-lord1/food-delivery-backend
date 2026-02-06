import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUtils.js';

// @route   GET /api/restaurants/:restaurantId/menu
export const getMenuItems = async (req, res, next) => {
  try {
    const { category, isVeg, search, sortBy, showAll } = req.query;

    let query = {
      restaurant: req.params.restaurantId,
      
    };

    if (category) {
      query.category = category;
    }

    if (isVeg === 'true') {
      query.isVeg = true;
    }


    if (search) {
      query.$text = { $search: search };
    }

    if (showAll !== 'true') {
      query.isAvailable = true;
    }

    let sort = 'category'; 
    if (sortBy === 'price_low') sort = 'price';
    if (sortBy === 'price_high') sort = '-price';
    if (sortBy === 'popular') sort = '-totalOrders';
    if (sortBy === 'rating') sort = '-averageRating';

    const menuItems = await MenuItem.find(query).sort(sort);

    res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/menu/:id
export const getMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate(
      'restaurant',
      'name location deliveryTime'
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/restaurants/:restaurantId/menu
export const createMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add items to this restaurant'
      });
    }

    if (req.file) {
      const imageResult = await uploadToCloudinary(
        req.file.buffer,
        'menu-items'
      );
      req.body.image = imageResult;
    }

    req.body.restaurant = req.params.restaurantId;

    const menuItem = await MenuItem.create(req.body);

    res.status(201).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/menu/:id
export const updateMenuItem = async (req, res, next) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (menuItem.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this menu item'
      });
    }

    if (req.file) {
      if (menuItem.image?.public_id) {
        await deleteFromCloudinary(menuItem.image.public_id);
      }
      const imageResult = await uploadToCloudinary(
        req.file.buffer,
        'menu-items'
      );
      req.body.image = imageResult;
    }

    menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/menu/:id
export const deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (menuItem.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this menu item'
      });
    }

    if (menuItem.image?.public_id) {
      await deleteFromCloudinary(menuItem.image.public_id);
    }

    await menuItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/menu/:id/toggle-availability
export const toggleAvailability = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (menuItem.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.status(200).json({
      success: true,
      data: {
        isAvailable: menuItem.isAvailable
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/restaurants/:restaurantId/menu/categories
export const getMenuCategories = async (req, res, next) => {
  try {
    const categories = await MenuItem.distinct('category', {
      restaurant: req.params.restaurantId,
      isAvailable: true
    });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};
