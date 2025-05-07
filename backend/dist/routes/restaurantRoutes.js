"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const restaurantController_1 = require("../controllers/restaurantController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// Public routes
router.get('/', restaurantController_1.getRestaurants);
router.get('/:id', restaurantController_1.getRestaurantById);
// Protected routes
router.post('/', auth_1.authMiddleware, (0, auth_1.checkRole)(['restaurant_owner']), restaurantController_1.createRestaurant);
router.put('/:id', auth_1.authMiddleware, (0, auth_1.checkRole)(['restaurant_owner']), restaurantController_1.updateRestaurant);
router.post('/:id/menu', auth_1.authMiddleware, (0, auth_1.checkRole)(['restaurant_owner']), upload_1.upload.single('image'), restaurantController_1.addMenuItem);
router.put('/:id/menu/:itemId', auth_1.authMiddleware, (0, auth_1.checkRole)(['restaurant_owner']), upload_1.upload.single('image'), restaurantController_1.updateMenuItem);
router.delete('/:id/menu/:itemId', auth_1.authMiddleware, (0, auth_1.checkRole)(['restaurant_owner']), restaurantController_1.deleteMenuItem);
router.post('/:id/reviews', auth_1.authMiddleware, (0, auth_1.checkRole)(['customer']), restaurantController_1.addReview);
exports.default = router;
