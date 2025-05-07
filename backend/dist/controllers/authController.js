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
exports.getPendingRestaurantOwners = exports.approveRestaurantOwner = exports.registerUser = void 0;
const admin = __importStar(require("firebase-admin"));
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, role, displayName, phoneNumber, address } = req.body;
        // Create user in Firebase Auth
        const userRecord = yield admin.auth().createUser({
            email,
            password,
            displayName,
            phoneNumber,
        });
        // Set custom claims based on role
        yield admin.auth().setCustomUserClaims(userRecord.uid, { role });
        // Create user profile in Firestore
        const userData = {
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
            const restaurantOwnerData = Object.assign(Object.assign({}, userData), { isApproved: false });
            yield admin.firestore().collection('users').doc(userRecord.uid).set(restaurantOwnerData);
        }
        else if (role === 'customer') {
            const customerData = Object.assign(Object.assign({}, userData), { favoriteRestaurants: [], orderHistory: [] });
            yield admin.firestore().collection('users').doc(userRecord.uid).set(customerData);
        }
        else {
            yield admin.firestore().collection('users').doc(userRecord.uid).set(userData);
        }
        res.status(201).json({ message: 'User registered successfully', uid: userRecord.uid });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});
exports.registerUser = registerUser;
const approveRestaurantOwner = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { uid } = req.params;
        // Update user document in Firestore
        yield admin.firestore().collection('users').doc(uid).update({
            isApproved: true,
            updatedAt: new Date(),
        });
        res.json({ message: 'Restaurant owner approved successfully' });
    }
    catch (error) {
        console.error('Approval error:', error);
        res.status(500).json({ message: 'Error approving restaurant owner' });
    }
});
exports.approveRestaurantOwner = approveRestaurantOwner;
const getPendingRestaurantOwners = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const snapshot = yield admin.firestore()
            .collection('users')
            .where('role', '==', 'restaurant_owner')
            .where('isApproved', '==', false)
            .get();
        const pendingOwners = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json(pendingOwners);
    }
    catch (error) {
        console.error('Error fetching pending owners:', error);
        res.status(500).json({ message: 'Error fetching pending restaurant owners' });
    }
});
exports.getPendingRestaurantOwners = getPendingRestaurantOwners;
