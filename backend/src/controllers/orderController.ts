import { Response } from 'express';
import * as admin from 'firebase-admin';
import { Order, OrderItem, OrderTracking } from '../models/Order';
import { AuthRequest } from '../middleware/auth';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const customerId = req.user?.uid;
    if (!customerId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { restaurantId, items, paymentMethod, deliveryAddress, deliveryLocation } = req.body;

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: OrderItem) => sum + (item.price * item.quantity), 0);

    const orderData: Partial<Order> = {
      restaurantId,
      customerId,
      items,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod,
      deliveryAddress,
      deliveryLocation,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orderRef = await admin.firestore().collection('orders').add(orderData);
    
    // Create initial tracking
    const trackingData: OrderTracking = {
      orderId: orderRef.id,
      status: 'pending',
      updatedAt: new Date(),
    };
    await admin.firestore().collection('orderTracking').doc(orderRef.id).set(trackingData);

    res.status(201).json({ id: orderRef.id, ...orderData });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    let query: admin.firestore.Query = admin.firestore().collection('orders');
    
    // Filter based on user role
    const userRecord = await admin.auth().getUser(userId);
    const userRole = userRecord.customClaims?.role;

    if (userRole === 'customer') {
      query = query.where('customerId', '==', userId);
    } else if (userRole === 'restaurant_owner') {
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const restaurantId = userDoc.data()?.restaurantId;
      if (restaurantId) {
        query = query.where('restaurantId', '==', restaurantId);
      }
    }

    const snapshot = await query.get();
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const orderRef = admin.firestore().collection('orders').doc(id);
    const order = await orderRef.get();

    if (!order.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderData = order.data();
    const userRecord = await admin.auth().getUser(userId);
    const userRole = userRecord.customClaims?.role;

    // Check authorization
    if (userRole === 'restaurant_owner') {
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const restaurantId = userDoc.data()?.restaurantId;
      if (orderData?.restaurantId !== restaurantId) {
        return res.status(403).json({ message: 'Not authorized to update this order' });
      }
    } else if (userRole === 'customer' && orderData?.customerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Update order status
    await orderRef.update({
      status,
      updatedAt: new Date(),
    });

    // Update tracking
    await admin.firestore().collection('orderTracking').doc(id).update({
      status,
      updatedAt: new Date(),
    });

    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
};

export const updateOrderTracking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { location } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const orderRef = admin.firestore().collection('orders').doc(id);
    const order = await orderRef.get();

    if (!order.exists) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderData = order.data();
    const userRecord = await admin.auth().getUser(userId);
    const userRole = userRecord.customClaims?.role;

    // Only restaurant owners can update tracking
    if (userRole !== 'restaurant_owner') {
      return res.status(403).json({ message: 'Not authorized to update tracking' });
    }

    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const restaurantId = userDoc.data()?.restaurantId;
    if (orderData?.restaurantId !== restaurantId) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    // Update tracking
    await admin.firestore().collection('orderTracking').doc(id).update({
      location,
      updatedAt: new Date(),
    });

    res.json({ message: 'Order tracking updated successfully' });
  } catch (error) {
    console.error('Update order tracking error:', error);
    res.status(500).json({ message: 'Error updating order tracking' });
  }
}; 