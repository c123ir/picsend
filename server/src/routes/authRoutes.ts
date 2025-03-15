import { Router } from 'express';
import AuthController from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { loggingClient } from '../utils/logging-client';

const router = Router();
const authController = new AuthController();

// مسیرهای عمومی (بدون نیاز به احراز هویت)
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/verify-phone', authController.verifyPhone);
router.post('/request-verification', authController.requestVerification);

// مسیرهای با احراز هویت
router.get('/refresh-token', authenticate, authController.refreshToken);
router.get('/verify-token', authenticate, authController.verifyToken);

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