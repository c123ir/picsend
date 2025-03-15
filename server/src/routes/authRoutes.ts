import express from 'express';
import AuthController from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { loggingClient } from '../utils/logging-client';

const router = express.Router();
const authController = new AuthController();

// مسیرهای احراز هویت
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/verify-phone', authController.verifyPhone);
router.post('/request-verification', authController.requestVerification);

// مسیرهای نیازمند احراز هویت
router.post('/logout', authMiddleware, authController.logout);
router.get('/refresh-token', authMiddleware, authController.refreshToken);
router.get('/verify-token', authMiddleware, authController.verifyToken);

// لاگ کردن درخواست‌های احراز هویت
router.use((req, res, next) => {
  loggingClient.debug('درخواست به مسیر احراز هویت', {
    method: req.method,
    path: req.path,
    action: 'auth_route_request'
  });
  next();
});

export default router;