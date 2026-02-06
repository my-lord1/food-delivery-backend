# Food Delivery Platform - Backend API

A comprehensive food delivery platform backend built with Node.js, Express, MongoDB, Socket.io, and Razorpay integration.

## Features

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Passport.js (Google OAuth)
- **Real-time**: Socket.io
- **Payment**: Razorpay
- **File Upload**: Cloudinary
- **Validation**: Express-validator
- **Security**: Rate Limiting, Mongo Sanitize

### Core Features
- **User Authentication**: JWT-based auth + Google OAuth 2.0
- **Restaurant Management**: Profile creation, menu management, order handling
- **Menu Browsing**: Categories, search, filters, customizations
- **Order Management**: Real-time order tracking with Socket.io
- **Payment Integration**: Razorpay payment gateway with saved payment methods
- **Review System**: Automatic moderation, restaurant responses
- **Favorites**: Save favorite restaurants and menu items
- **Notifications**: Real-time push notifications for order updates
- **Delivery Scheduling**: Immediate or scheduled delivery with 5-minute time slots

##  API Endpoints

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
GET    /api/auth/me                - Get current user
PUT    /api/auth/profile           - Update profile
PUT    /api/auth/update-password   - Update password
GET    /api/auth/google            - Google OAuth login
POST   /api/auth/addresses         - Add address
PUT    /api/auth/addresses/:id     - Update address
DELETE /api/auth/addresses/:id     - Delete address
```

### Restaurants
```
GET    /api/restaurants            - Get all restaurants (with filters)
GET    /api/restaurants/:id        - Get single restaurant
POST   /api/restaurants            - Create restaurant (Owner)
PUT    /api/restaurants/:id        - Update restaurant (Owner)
DELETE /api/restaurants/:id        - Delete restaurant (Owner)
PATCH  /api/restaurants/:id/toggle-orders - Toggle accepting orders
GET    /api/restaurants/:id/stats  - Get restaurant stats
GET    /api/restaurants/:id/orders - Get restaurant orders
```

### Menu
```
GET    /api/restaurants/:restaurantId/menu  - Get menu items
GET    /api/menu/:id                        - Get single menu item
POST   /api/restaurants/:restaurantId/menu  - Create menu item (Owner)
PUT    /api/menu/:id                        - Update menu item (Owner)
DELETE /api/menu/:id                        - Delete menu item (Owner)
PATCH  /api/menu/:id/toggle-availability    - Toggle availability
GET    /api/restaurants/:restaurantId/menu/categories - Get categories
```

### Orders
```
POST   /api/orders                 - Create order
POST   /api/orders/verify-payment  - Verify Razorpay payment
GET    /api/orders                 - Get user orders
GET    /api/orders/:id             - Get single order
GET    /api/orders/:id/track       - Track order
PATCH  /api/orders/:id/status      - Update order status (Owner)
PATCH  /api/orders/:id/cancel      - Cancel order
```

### Reviews
```
POST   /api/reviews                        - Create review
GET    /api/reviews/restaurant/:id         - Get restaurant reviews
GET    /api/reviews/:id                    - Get single review
PUT    /api/reviews/:id                    - Update review
DELETE /api/reviews/:id                    - Delete review
POST   /api/reviews/:id/respond            - Restaurant response (Owner)
POST   /api/reviews/:id/helpful            - Mark as helpful
```

### Favorites
```
POST   /api/favorites/restaurants/:id      - Toggle favorite restaurant
GET    /api/favorites/restaurants          - Get favorite restaurants
POST   /api/favorites/menu-items/:id       - Toggle favorite menu item
GET    /api/favorites/menu-items           - Get favorite menu items
```

### Payments
```
POST   /api/payments/save-method           - Save payment method
GET    /api/payments/saved-methods         - Get saved methods
DELETE /api/payments/saved-methods/:id     - Delete method
PATCH  /api/payments/saved-methods/:id/set-default - Set default
GET    /api/payments/history               - Payment history
GET    /api/payments/receipt/:orderId      - Get receipt
```

### Notifications
```
GET    /api/notifications          - Get notifications
PATCH  /api/notifications/:id/read - Mark as read
PATCH  /api/notifications/read-all - Mark all as read
DELETE /api/notifications/:id      - Delete notification
DELETE /api/notifications          - Clear all
```