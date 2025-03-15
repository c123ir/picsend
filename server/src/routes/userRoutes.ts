import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import UserController from '../controllers/userController';

const router = express.Router();
const userController = new UserController();

// مسیرهای عمومی
router.get('/profile/:id', userController.getUserProfile);

// مسیرهای با احراز هویت
router.get('/me', authMiddleware, userController.getMyProfile);
router.put('/me', authMiddleware, userController.updateMyProfile);
router.put('/me/password', authMiddleware, userController.changePassword);
router.delete('/me', authMiddleware, userController.deleteMyAccount);

// مسیرهای مدیریتی (فقط برای ادمین)
router.get('/', authMiddleware, adminMiddleware, userController.getAllUsers);
router.post('/', authMiddleware, adminMiddleware, userController.createUser);
router.get('/:id', authMiddleware, adminMiddleware, userController.getUserById);
router.put('/:id', authMiddleware, adminMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUser);
router.put('/:id/activate', authMiddleware, adminMiddleware, userController.activateUser);
router.put('/:id/deactivate', authMiddleware, adminMiddleware, userController.deactivateUser);

export default router; 