import express, { Router, Request, Response, NextFunction } from 'express';
import { sendVerificationCode, verifyCode, loginWithUsername } from '../controllers/authController';

const router: Router = express.Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

router.post('/send-code', asyncHandler(sendVerificationCode));
router.post('/verify-code', asyncHandler(verifyCode));

router.post('/login', asyncHandler(loginWithUsername));

export default router;