import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';


// @route   POST /api/favorites/restaurants/:restaurantId
export const toggleFavoriteRestaurant = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const restaurant = await Restaurant.findById(req.params.restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const index = user.favoriteRestaurants.indexOf(req.params.restaurantId);

    if (index > -1) {
      user.favoriteRestaurants.splice(index, 1);
    } else {
      user.favoriteRestaurants.push(req.params.restaurantId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      isFavorite: index === -1,
      data: user.favoriteRestaurants
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/favorites/restaurants
export const getFavoriteRestaurants = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favoriteRestaurants',
      select: 'name cuisineType averageRating images location priceRange deliveryTime isAcceptingOrders'
    });

    res.status(200).json({
      success: true,
      count: user.favoriteRestaurants.length,
      data: user.favoriteRestaurants
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/favorites/menu-items/:menuItemId
export const toggleFavoriteMenuItem = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const menuItem = await MenuItem.findById(req.params.menuItemId);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const index = user.favoriteMenuItems.findIndex(
      item => item.menuItem.toString() === req.params.menuItemId
    );

    if (index > -1) {
      user.favoriteMenuItems.splice(index, 1);
    } else {
      user.favoriteMenuItems.push({
        restaurant: menuItem.restaurant,
        menuItem: req.params.menuItemId
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      isFavorite: index === -1,
      data: user.favoriteMenuItems
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/favorites/menu-items
export const getFavoriteMenuItems = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'favoriteMenuItems.restaurant',
        select: 'name images location'
      })
      .populate({
        path: 'favoriteMenuItems.menuItem',
        select: 'name price image category isVeg isAvailable'
      });

    res.status(200).json({
      success: true,
      count: user.favoriteMenuItems.length,
      data: user.favoriteMenuItems
    });
  } catch (error) {
    next(error);
  }
};
