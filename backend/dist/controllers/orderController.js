"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderTracking = exports.updateOrderStatus = exports.getOrders = exports.createOrder = void 0;
const admin = __importStar(require("firebase-admin"));
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const customerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!customerId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const { restaurantId, items, paymentMethod, deliveryAddress, deliveryLocation } = req.body;
        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderData = {
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
        const orderRef = yield admin.firestore().collection('orders').add(orderData);
        // Create initial tracking
        const trackingData = {
            orderId: orderRef.id,
            status: 'pending',
            updatedAt: new Date(),
        };
        yield admin.firestore().collection('orderTracking').doc(orderRef.id).set(trackingData);
        res.status(201).json(Object.assign({ id: orderRef.id }, orderData));
    }
    catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Error creating order' });
    }
});
exports.createOrder = createOrder;
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        let query = admin.firestore().collection('orders');
        // Filter based on user role
        const userRecord = yield admin.auth().getUser(userId);
        const userRole = (_b = userRecord.customClaims) === null || _b === void 0 ? void 0 : _b.role;
        if (userRole === 'customer') {
            query = query.where('customerId', '==', userId);
        }
        else if (userRole === 'restaurant_owner') {
            const userDoc = yield admin.firestore().collection('users').doc(userId).get();
            const restaurantId = (_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.restaurantId;
            if (restaurantId) {
                query = query.where('restaurantId', '==', restaurantId);
            }
        }
        const snapshot = yield query.get();
        const orders = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json(orders);
    }
    catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});
exports.getOrders = getOrders;
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const orderRef = admin.firestore().collection('orders').doc(id);
        const order = yield orderRef.get();
        if (!order.exists) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const orderData = order.data();
        const userRecord = yield admin.auth().getUser(userId);
        const userRole = (_b = userRecord.customClaims) === null || _b === void 0 ? void 0 : _b.role;
        // Check authorization
        if (userRole === 'restaurant_owner') {
            const userDoc = yield admin.firestore().collection('users').doc(userId).get();
            const restaurantId = (_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.restaurantId;
            if ((orderData === null || orderData === void 0 ? void 0 : orderData.restaurantId) !== restaurantId) {
                return res.status(403).json({ message: 'Not authorized to update this order' });
            }
        }
        else if (userRole === 'customer' && (orderData === null || orderData === void 0 ? void 0 : orderData.customerId) !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }
        // Update order status
        yield orderRef.update({
            status,
            updatedAt: new Date(),
        });
        // Update tracking
        yield admin.firestore().collection('orderTracking').doc(id).update({
            status,
            updatedAt: new Date(),
        });
        res.json({ message: 'Order status updated successfully' });
    }
    catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Error updating order status' });
    }
});
exports.updateOrderStatus = updateOrderStatus;
const updateOrderTracking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const { location } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const orderRef = admin.firestore().collection('orders').doc(id);
        const order = yield orderRef.get();
        if (!order.exists) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const orderData = order.data();
        const userRecord = yield admin.auth().getUser(userId);
        const userRole = (_b = userRecord.customClaims) === null || _b === void 0 ? void 0 : _b.role;
        // Only restaurant owners can update tracking
        if (userRole !== 'restaurant_owner') {
            return res.status(403).json({ message: 'Not authorized to update tracking' });
        }
        const userDoc = yield admin.firestore().collection('users').doc(userId).get();
        const restaurantId = (_c = userDoc.data()) === null || _c === void 0 ? void 0 : _c.restaurantId;
        if ((orderData === null || orderData === void 0 ? void 0 : orderData.restaurantId) !== restaurantId) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }
        // Update tracking
        yield admin.firestore().collection('orderTracking').doc(id).update({
            location,
            updatedAt: new Date(),
        });
        res.json({ message: 'Order tracking updated successfully' });
    }
    catch (error) {
        console.error('Update order tracking error:', error);
        res.status(500).json({ message: 'Error updating order tracking' });
    }
});
exports.updateOrderTracking = updateOrderTracking;
