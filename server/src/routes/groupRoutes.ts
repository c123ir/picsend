import { Router } from 'express';
import GroupController from '../controllers/groupController';
import { authenticate } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/roleMiddleware';
import { loggingClient } from '../utils/logging-client';

const router = Router();
const groupController = new GroupController();

// مسیرهای عمومی
router.get('/public', groupController.getPublicGroups);
router.get('/public/:id', groupController.getPublicGroup);

// مسیرهای با احراز هویت
router.get('/my', authenticate, groupController.getMyGroups);
router.post('/', authenticate, groupController.createGroup);
router.get('/:id', authenticate, groupController.getGroup);
router.put('/:id', authenticate, groupController.updateGroup);
router.delete('/:id', authenticate, groupController.deleteGroup);

// مسیرهای مدیریت اعضای گروه
router.get('/:id/members', authenticate, groupController.getGroupMembers);
router.post('/:id/members', authenticate, groupController.addGroupMember);
router.delete('/:id/members/:userId', authenticate, groupController.removeGroupMember);
router.put('/:id/members/:userId', authenticate, groupController.updateGroupMemberRole);

// مسیرهای مدیریتی (فقط برای ادمین)
router.get('/admin/all', authenticate, isAdmin, groupController.getAllGroups);
router.delete('/admin/:id', authenticate, isAdmin, groupController.adminDeleteGroup);
router.put('/admin/:id/activate', authenticate, isAdmin, groupController.activateGroup);
router.put('/admin/:id/deactivate', authenticate, isAdmin, groupController.deactivateGroup);

// مسیرهای مربوط به تصاویر گروه
router.get('/:id/images', authenticate, groupController.getGroupImages);

// میدل‌ور لاگ کردن درخواست‌های گروه
router.use((req, res, next) => {
  loggingClient.debug('درخواست به مسیر گروه‌ها', {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    action: 'group_route_request'
  });
  next();
});

export default router; 