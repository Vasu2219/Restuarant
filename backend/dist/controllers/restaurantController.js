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
exports.addReview = exports.deleteMenuItem = exports.updateMenuItem = exports.addMenuItem = exports.updateRestaurant = exports.getRestaurantById = exports.getRestaurants = exports.createRestaurant = void 0;
const admin = __importStar(require("firebase-admin"));
const imageUpload_1 = require("../utils/imageUpload");
const createRestaurant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, description, address, location, openingHours } = req.body;
        const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!ownerId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const restaurantData = {
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
        const docRef = yield admin.firestore().collection('restaurants').add(restaurantData);
        // Update the restaurant owner's document with the restaurant ID
        yield admin.firestore().collection('users').doc(ownerId).update({
            restaurantId: docRef.id,
        });
        res.status(201).json(Object.assign({ id: docRef.id }, restaurantData));
    }
    catch (error) {
        console.error('Create restaurant error:', error);
        res.status(500).json({ message: 'Error creating restaurant' });
    }
});
exports.createRestaurant = createRestaurant;
const getRestaurants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield admin.firestore().collection('restaurants').get();
        const restaurants = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json(restaurants);
    }
    catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({ message: 'Error fetching restaurants' });
    }
});
exports.getRestaurants = getRestaurants;
const getRestaurantById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const doc = yield admin.firestore().collection('restaurants').doc(id).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json(Object.assign({ id: doc.id }, doc.data()));
    }
    catch (error) {
        console.error('Get restaurant error:', error);
        res.status(500).json({ message: 'Error fetching restaurant' });
    }
});
exports.getRestaurantById = getRestaurantById;
const updateRestaurant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const updateData = req.body;
        const restaurantRef = admin.firestore().collection('restaurants').doc(id);
        const restaurant = yield restaurantRef.get();
        if (!restaurant.exists) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        if (((_b = restaurant.data()) === null || _b === void 0 ? void 0 : _b.ownerId) !== ownerId) {
            return res.status(403).json({ message: 'Not authorized to update this restaurant' });
        }
        yield restaurantRef.update(Object.assign(Object.assign({}, updateData), { updatedAt: new Date() }));
        res.json({ message: 'Restaurant updated successfully' });
    }
    catch (error) {
        console.error('Update restaurant error:', error);
        res.status(500).json({ message: 'Error updating restaurant' });
    }
});
exports.updateRestaurant = updateRestaurant;
const addMenuItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const { name, description, price, category } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'Image is required' });
        }
        const restaurantRef = admin.firestore().collection('restaurants').doc(id);
        const restaurant = yield restaurantRef.get();
        if (!restaurant.exists) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        if (((_b = restaurant.data()) === null || _b === void 0 ? void 0 : _b.ownerId) !== ownerId) {
            return res.status(403).json({ message: 'Not authorized to update this restaurant' });
        }
        // Upload image to Firebase Storage
        const imageUrl = yield (0, imageUpload_1.uploadImage)(file, `restaurants/${id}/menu`);
        const menuItem = {
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
        yield restaurantRef.update({
            menu: admin.firestore.FieldValue.arrayUnion(menuItem),
            updatedAt: new Date(),
        });
        res.status(201).json(menuItem);
    }
    catch (error) {
        console.error('Add menu item error:', error);
        res.status(500).json({ message: 'Error adding menu item' });
    }
});
exports.addMenuItem = addMenuItem;
const updateMenuItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id, itemId } = req.params;
        const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const { name, description, price, category, isAvailable } = req.body;
        const file = req.file;
        const restaurantRef = admin.firestore().collection('restaurants').doc(id);
        const restaurant = yield restaurantRef.get();
        if (!restaurant.exists) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        if (((_b = restaurant.data()) === null || _b === void 0 ? void 0 : _b.ownerId) !== ownerId) {
            return res.status(403).json({ message: 'Not authorized to update this restaurant' });
        }
        const menu = ((_c = restaurant.data()) === null || _c === void 0 ? void 0 : _c.menu) || [];
        const itemIndex = menu.findIndex((item) => item.id === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        let imageUrl = menu[itemIndex].imageUrl;
        if (file) {
            // Delete old image
            yield (0, imageUpload_1.deleteImage)(imageUrl);
            // Upload new image
            imageUrl = yield (0, imageUpload_1.uploadImage)(file, `restaurants/${id}/menu`);
        }
        menu[itemIndex] = Object.assign(Object.assign({}, menu[itemIndex]), { name: name || menu[itemIndex].name, description: description || menu[itemIndex].description, price: price ? Number(price) : menu[itemIndex].price, category: category || menu[itemIndex].category, imageUrl, isAvailable: isAvailable !== undefined ? isAvailable : menu[itemIndex].isAvailable, updatedAt: new Date() });
        yield restaurantRef.update({
            menu,
            updatedAt: new Date(),
        });
        res.json(menu[itemIndex]);
    }
    catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({ message: 'Error updating menu item' });
    }
});
exports.updateMenuItem = updateMenuItem;
const deleteMenuItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id, itemId } = req.params;
        const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const restaurantRef = admin.firestore().collection('restaurants').doc(id);
        const restaurant = yield restaurantRef.get();
        if (!restaurant.exists) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        if (((_b = restaurant.data()) === null || _b === void 0 ? void 0 : _b.ownerId) !== ownerId) {
            return res.status(403).json({ message: 'Not authorized to update this restaurant' });
        }
        const menu = ((_c = restaurant.data()) === null || _c === void 0 ? void 0 : _c.menu) || [];
        const itemIndex = menu.findIndex((item) => item.id === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        // Delete image from storage
        yield (0, imageUpload_1.deleteImage)(menu[itemIndex].imageUrl);
        // Remove item from menu array
        menu.splice(itemIndex, 1);
        yield restaurantRef.update({
            menu,
            updatedAt: new Date(),
        });
        res.json({ message: 'Menu item deleted successfully' });
    }
    catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({ message: 'Error deleting menu item' });
    }
});
exports.deleteMenuItem = deleteMenuItem;
const addReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const { rating, comment } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const review = {
            id: admin.firestore().collection('reviews').doc().id,
            restaurantId: id,
            userId,
            rating,
            comment,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Add review
        yield admin.firestore().collection('reviews').doc(review.id).set(review);
        // Update restaurant rating
        const restaurantRef = admin.firestore().collection('restaurants').doc(id);
        const restaurant = yield restaurantRef.get();
        if (!restaurant.exists) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        const currentRating = ((_b = restaurant.data()) === null || _b === void 0 ? void 0 : _b.rating) || 0;
        const totalRatings = ((_c = restaurant.data()) === null || _c === void 0 ? void 0 : _c.totalRatings) || 0;
        const newTotalRatings = totalRatings + 1;
        const newRating = ((currentRating * totalRatings) + rating) / newTotalRatings;
        yield restaurantRef.update({
            rating: newRating,
            totalRatings: newTotalRatings,
            updatedAt: new Date(),
        });
        res.status(201).json(review);
    }
    catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ message: 'Error adding review' });
    }
});
exports.addReview = addReview;
