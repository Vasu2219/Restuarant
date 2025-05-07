export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'restaurant_owner' | 'customer';
  displayName: string;
  phoneNumber?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantOwner extends User {
  restaurantId?: string;
  isApproved: boolean;
}

export interface Customer extends User {
  favoriteRestaurants?: string[];
  orderHistory?: string[];
} 