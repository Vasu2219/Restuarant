"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes
router.post('/register', authController_1.registerUser);
// Protected routes
router.get('/pending-owners', auth_1.authMiddleware, (0, auth_1.checkRole)(['admin']), authController_1.getPendingRestaurantOwners);
router.post('/approve-owner/:uid', auth_1.authMiddleware, (0, auth_1.checkRole)(['admin']), authController_1.approveRestaurantOwner);
exports.default = router;
