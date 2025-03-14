import express, { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getUserByPhone,
  getUserByEmail,
  createUser,
  updateUser,
  getUserById,
  updateLastLogin,
  deactivateUser,
  activateUser
} from '../controllers/userController';
import Logger from '../utils/logger';

const router: Router = express.Router();

// مسیرهای عمومی
router.get('/phone/:phone', getUserByPhone as express.RequestHandler);
router.get('/email/:email', getUserByEmail as express.RequestHandler);
router.post('/', createUser as express.RequestHandler);

// مسیرهای محافظت شده
router.use(auth as express.RequestHandler);
router.patch('/:id', updateUser as express.RequestHandler);
router.get('/:id', getUserById as express.RequestHandler);
router.post('/:id/last-login', updateLastLogin as express.RequestHandler);
router.post('/:id/deactivate', deactivateUser as express.RequestHandler);
router.post('/:id/activate', activateUser as express.RequestHandler);

// لاگ کردن درخواست‌های مسیر کاربران
router.use((req, res, next) => {
  Logger.info('درخواست به مسیر کاربران', {
    method: req.method,
    path: req.path,
    userId: req.user?.id
  });
  next();
});

export default router; 