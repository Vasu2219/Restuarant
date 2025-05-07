import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { User, RestaurantOwner, Customer } from '../models/User';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role, displayName, phoneNumber, address } = req.body;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      phoneNumber,
    });

    // Set custom claims based on role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // Create user profile in Firestore
    const userData: Partial<User> = {
      uid: userRecord.uid,
      email,
      role,
      displayName,
      phoneNumber,
      address,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add role-specific data
    if (role === 'restaurant_owner') {
      const restaurantOwnerData: Partial<RestaurantOwner> = {
        ...userData,
        isApproved: false,
      };
      await admin.firestore().collection('users').doc(userRecord.uid).set(restaurantOwnerData);
    } else if (role === 'customer') {
      const customerData: Partial<Customer> = {
        ...userData,
        favoriteRestaurants: [],
        orderHistory: [],
      };
      await admin.firestore().collection('users').doc(userRecord.uid).set(customerData);
    } else {
      await admin.firestore().collection('users').doc(userRecord.uid).set(userData);
    }

    res.status(201).json({ message: 'User registered successfully', uid: userRecord.uid });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

export const approveRestaurantOwner = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    
    // Update user document in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      isApproved: true,
      updatedAt: new Date(),
    });

    res.json({ message: 'Restaurant owner approved successfully' });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ message: 'Error approving restaurant owner' });
  }
};

export const getPendingRestaurantOwners = async (req: Request, res: Response) => {
  try {
    const snapshot = await admin.firestore()
      .collection('users')
      .where('role', '==', 'restaurant_owner')
      .where('isApproved', '==', false)
      .get();

    const pendingOwners = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(pendingOwners);
  } catch (error) {
    console.error('Error fetching pending owners:', error);
    res.status(500).json({ message: 'Error fetching pending restaurant owners' });
  }
}; 