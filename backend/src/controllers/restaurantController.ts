import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { Restaurant, MenuItem, RestaurantReview } from '../models/Restaurant';
import { AuthRequest } from '../middleware/auth';
import { uploadImage, deleteImage } from '../utils/imageUpload';

export const createRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, address, location, openingHours } = req.body;
    const ownerId = req.user?.uid;

    if (!ownerId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const restaurantData: Partial<Restaurant> = {
      name,
      description,
      address,
      location,
      ownerId,
      menu: [],
      rating: 0,
      totalRatings: 0,
      openingHours,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await admin.firestore().collection('restaurants').add(restaurantData);
    
    // Update the restaurant owner's document with the restaurant ID
    await admin.firestore().collection('users').doc(ownerId).update({
      restaurantId: docRef.id,
    });

    res.status(201).json({ id: docRef.id, ...restaurantData });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ message: 'Error creating restaurant' });
  }
};

export const getRestaurants = async (req: Request, res: Response) => {
  try {
    const snapshot = await admin.firestore().collection('restaurants').get();
    const restaurants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(restaurants);
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ message: 'Error fetching restaurants' });
  }
};

export const getRestaurantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await admin.firestore().collection('restaurants').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ message: 'Error fetching restaurant' });
  }
};

export const updateRestaurant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ownerId = req.user?.uid;
    const updateData = req.body;

    const restaurantRef = admin.firestore().collection('restaurants').doc(id);
    const restaurant = await restaurantRef.get();

    if (!restaurant.exists) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.data()?.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    await restaurantRef.update({
      ...updateData,
      updatedAt: new Date(),
    });

    res.json({ message: 'Restaurant updated successfully' });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ message: 'Error updating restaurant' });
  }
};

export const addMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ownerId = req.user?.uid;
    const { name, description, price, category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const restaurantRef = admin.firestore().collection('restaurants').doc(id);
    const restaurant = await restaurantRef.get();

    if (!restaurant.exists) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.data()?.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    // Upload image to Firebase Storage
    const imageUrl = await uploadImage(file, `restaurants/${id}/menu`);

    const menuItem: MenuItem = {
      id: admin.firestore().collection('restaurants').doc().id,
      name,
      description,
      price: Number(price),
      category,
      imageUrl,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await restaurantRef.update({
      menu: admin.firestore.FieldValue.arrayUnion(menuItem),
      updatedAt: new Date(),
    });

    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ message: 'Error adding menu item' });
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const ownerId = req.user?.uid;
    const { name, description, price, category, isAvailable } = req.body;
    const file = req.file;

    const restaurantRef = admin.firestore().collection('restaurants').doc(id);
    const restaurant = await restaurantRef.get();

    if (!restaurant.exists) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.data()?.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    const menu = restaurant.data()?.menu || [];
    const itemIndex = menu.findIndex((item: MenuItem) => item.id === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    let imageUrl = menu[itemIndex].imageUrl;
    if (file) {
      // Delete old image
      await deleteImage(imageUrl);
      // Upload new image
      imageUrl = await uploadImage(file, `restaurants/${id}/menu`);
    }

    menu[itemIndex] = {
      ...menu[itemIndex],
      name: name || menu[itemIndex].name,
      description: description || menu[itemIndex].description,
      price: price ? Number(price) : menu[itemIndex].price,
      category: category || menu[itemIndex].category,
      imageUrl,
      isAvailable: isAvailable !== undefined ? isAvailable : menu[itemIndex].isAvailable,
      updatedAt: new Date(),
    };

    await restaurantRef.update({
      menu,
      updatedAt: new Date(),
    });

    res.json(menu[itemIndex]);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Error updating menu item' });
  }
};

export const deleteMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const ownerId = req.user?.uid;

    const restaurantRef = admin.firestore().collection('restaurants').doc(id);
    const restaurant = await restaurantRef.get();

    if (!restaurant.exists) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.data()?.ownerId !== ownerId) {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    const menu = restaurant.data()?.menu || [];
    const itemIndex = menu.findIndex((item: MenuItem) => item.id === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Delete image from storage
    await deleteImage(menu[itemIndex].imageUrl);

    // Remove item from menu array
    menu.splice(itemIndex, 1);

    await restaurantRef.update({
      menu,
      updatedAt: new Date(),
    });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Error deleting menu item' });
  }
};

export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const review: RestaurantReview = {
      id: admin.firestore().collection('reviews').doc().id,
      restaurantId: id,
      userId,
      rating,
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add review
    await admin.firestore().collection('reviews').doc(review.id).set(review);

    // Update restaurant rating
    const restaurantRef = admin.firestore().collection('restaurants').doc(id);
    const restaurant = await restaurantRef.get();

    if (!restaurant.exists) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const currentRating = restaurant.data()?.rating || 0;
    const totalRatings = restaurant.data()?.totalRatings || 0;
    const newTotalRatings = totalRatings + 1;
    const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;

    await restaurantRef.update({
      rating: newRating,
      totalRatings: newTotalRatings,
      updatedAt: new Date(),
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Error adding review' });
  }
};