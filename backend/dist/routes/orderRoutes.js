"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Protected routes
router.post('/', auth_1.authMiddleware, (0, auth_1.checkRole)(['customer']), orderController_1.createOrder);
router.get('/', auth_1.authMiddleware, orderController_1.getOrders);
router.put('/:id/status', auth_1.authMiddleware, orderController_1.updateOrderStatus);
router.put('/:id/tracking', auth_1.authMiddleware, (0, auth_1.checkRole)(['restaurant_owner']), orderController_1.updateOrderTracking);
exports.default = router;
