import { Request, Response } from 'express';
import { Group, GroupMember, User, Image, ImageShare } from '../models';
import { loggingClient } from '../utils/logging-client';

class GroupController {
  /**
   * دریافت گروه‌های کاربر لاگین شده
   */
  public getMyGroups = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // گروه‌هایی که کاربر ایجاد کرده است
      const ownedGroups = await Group.findAll({
        where: { ownerId: userId },
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'fullName', 'avatar']
          }
        ]
      });

      // گروه‌هایی که کاربر عضو آنهاست
      const memberGroups = await Group.findAll({
        include: [
          {
            model: GroupMember,
            as: 'members',
            where: { userId },
            attributes: ['role', 'joinedAt']
          },
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'fullName', 'avatar']
          }
        ],
        limit: Number(limit),
        offset
      });

      // ترکیب گروه‌ها و حذف موارد تکراری
      const allGroups = [...ownedGroups];
      
      memberGroups.forEach(group => {
        if (!allGroups.some(g => g.id === group.id)) {
          allGroups.push(group);
        }
      });

      loggingClient.info('دریافت گروه‌های کاربر', {
        userId,
        page,
        limit,
        count: allGroups.length,
        action: 'get_user_groups'
      });

      res.json({
        groups: allGroups,
        count: allGroups.length
      });
    } catch (error) {
      loggingClient.error('خطا در دریافت گروه‌های کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'get_user_groups_error'
      });
      res.status(500).json({ message: 'خطا در دریافت گروه‌ها' });
    }
  };

  /**
   * ایجاد گروه جدید
   */
  public createGroup = async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      const userId = (req as any).user.id;

      if (!name) {
        return res.status(400).json({ message: 'نام گروه الزامی است' });
      }

      // ایجاد گروه
      const group = await Group.create({
        name,
        description,
        ownerId: userId
      });

      // افزودن سازنده به اعضای گروه با نقش مدیر
      await GroupMember.create({
        groupId: group.id,
        userId,
        role: 'admin',
        joinedAt: new Date()
      });

      loggingClient.info('گروه جدید ایجاد شد', {
        groupId: group.id,
        userId,
        groupName: name,
        action: 'create_group_success'
      });

      res.status(201).json({
        message: 'گروه با موفقیت ایجاد شد',
        group
      });
    } catch (error) {
      loggingClient.error('خطا در ایجاد گروه', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'create_group_error'
      });
      res.status(500).json({ message: 'خطا در ایجاد گروه' });
    }
  };

  /**
   * دریافت اطلاعات یک گروه با شناسه
   */
  public getGroupById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      // دریافت گروه با اطلاعات مالک و اعضا
      const group = await Group.findByPk(id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'fullName', 'avatar']
          },
          {
            model: GroupMember,
            as: 'members',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'fullName', 'avatar']
              }
            ]
          }
        ]
      });

      if (!group) {
        return res.status(404).json({ message: 'گروه یافت نشد' });
      }

      // بررسی دسترسی کاربر به گروه
      const isMember = await GroupMember.findOne({
        where: { groupId: id, userId }
      });

      if (!isMember && group.ownerId !== userId && (req as any).user.role !== 'admin') {
        return res.status(403).json({ message: 'شما به این گروه دسترسی ندارید' });
      }

      loggingClient.info('دریافت اطلاعات گروه', {
        groupId: group.id,
        userId,
        action: 'get_group_by_id'
      });

      res.json(group);
    } catch (error) {
      loggingClient.error('خطا در دریافت اطلاعات گروه', {
        error: error instanceof Error ? error.message : String(error),
        groupId: req.params.id,
        userId: (req as any).user?.id,
        action: 'get_group_by_id_error'
      });
      res.status(500).json({ message: 'خطا در دریافت اطلاعات گروه' });
    }
  };

  /**
   * بروزرسانی اطلاعات گروه
   */
  public updateGroup = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const userId = (req as any).user.id;

      const group = await Group.findByPk(id);

      if (!group) {
        return res.status(404).json({ message: 'گروه یافت نشد' });
      }

      // بررسی مالکیت یا دسترسی ادمین
      if (group.ownerId !== userId && (req as any).user.role !== 'admin') {
        // بررسی عضویت با نقش مدیر
        const isMember = await GroupMember.findOne({
          where: { groupId: id, userId, role: 'admin' }
        });

        if (!isMember) {
          return res.status(403).json({ message: 'شما اجازه ویرایش این گروه را ندارید' });
        }
      }

      // بروزرسانی اطلاعات
      await group.update({ name, description });

      loggingClient.info('اطلاعات گروه بروزرسانی شد', {
        groupId: group.id,
        userId,
        action: 'update_group_success'
      });

      res.json({
        message: 'گروه با موفقیت بروزرسانی شد',
        group
      });
    } catch (error) {
      loggingClient.error('خطا در بروزرسانی گروه', {
        error: error instanceof Error ? error.message : String(error),
        groupId: req.params.id,
        userId: (req as any).user?.id,
        action: 'update_group_error'
      });
      res.status(500).json({ message: 'خطا در بروزرسانی گروه' });
    }
  };

  /**
   * حذف گروه
   */
  public deleteGroup = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const group = await Group.findByPk(id);

      if (!group) {
        return res.status(404).json({ message: 'گروه یافت نشد' });
      }

      // بررسی مالکیت
      if (group.ownerId !== userId && (req as any).user.role !== 'admin') {
        return res.status(403).json({ message: 'شما اجازه حذف این گروه را ندارید' });
      }

      // حذف گروه
      await group.destroy();

      loggingClient.info('گروه حذف شد', {
        groupId: id,
        userId,
        action: 'delete_group_success'
      });

      res.json({ message: 'گروه با موفقیت حذف شد' });
    } catch (error) {
      loggingClient.error('خطا در حذف گروه', {
        error: error instanceof Error ? error.message : String(error),
        groupId: req.params.id,
        userId: (req as any).user?.id,
        action: 'delete_group_error'
      });
      res.status(500).json({ message: 'خطا در حذف گروه' });
    }
  };

  /**
   * دریافت اعضای گروه
   */
  public getGroupMembers = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const group = await Group.findByPk(id);

      if (!group) {
        return res.status(404).json({ message: 'گروه یافت نشد' });
      }

      // بررسی دسترسی
      const isMember = await GroupMember.findOne({
        where: { groupId: id, userId }
      });

      if (!isMember && group.ownerId !== userId && (req as any).user.role !== 'admin') {
        return res.status(403).json({ message: 'شما به این گروه دسترسی ندارید' });
      }

      // دریافت اعضا
      const members = await GroupMember.findAll({
        where: { groupId: id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'avatar', 'email', 'phone']
          }
        ]
      });

      loggingClient.info('دریافت اعضای گروه', {
        groupId: id,
        userId,
        membersCount: members.length,
        action: 'get_group_members'
      });

      res.json(members);
    } catch (error) {
      loggingClient.error('خطا در دریافت اعضای گروه', {
        error: error instanceof Error ? error.message : String(error),
        groupId: req.params.id,
        userId: (req as any).user?.id,
        action: 'get_group_members_error'
      });
      res.status(500).json({ message: 'خطا در دریافت اعضای گروه' });
    }
  };

  /**
   * افزودن عضو به گروه
   */
  public addGroupMember = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId: memberId, role } = req.body;
      const userId = (req as any).user.id;

      if (!memberId) {
        return res.status(400).json({ message: 'شناسه کاربر الزامی است' });
      }

      const group = await Group.findByPk(id);

      if (!group) {
        return res.status(404).json({ message: 'گروه یافت نشد' });
      }

      // بررسی دسترسی
      if (group.ownerId !== userId && (req as any).user.role !== 'admin') {
        const userMembership = await GroupMember.findOne({
          where: { groupId: id, userId, role: 'admin' }
        });

        if (!userMembership) {
          return res.status(403).json({ message: 'شما اجازه افزودن عضو به این گروه را ندارید' });
        }
      }

      // بررسی وجود کاربر
      const member = await User.findByPk(memberId);
      if (!member) {
        return res.status(404).json({ message: 'کاربر مورد نظر یافت نشد' });
      }

      // بررسی عضویت قبلی
      const existingMembership = await GroupMember.findOne({
        where: { groupId: id, userId: memberId }
      });

      if (existingMembership) {
        return res.status(400).json({ message: 'این کاربر قبلاً عضو گروه است' });
      }

      // افزودن عضو
      const membership = await GroupMember.create({
        groupId: id,
        userId: memberId,
        role: role || 'member',
        joinedAt: new Date()
      });

      loggingClient.info('عضو جدید به گروه اضافه شد', {
        groupId: id,
        userId,
        memberId,
        role: role || 'member',
        action: 'add_group_member'
      });

      res.status(201).json({
        message: 'کاربر با موفقیت به گروه اضافه شد',
        membership
      });
    } catch (error) {
      loggingClient.error('خطا در افزودن عضو به گروه', {
        error: error instanceof Error ? error.message : String(error),
        groupId: req.params.id,
        userId: (req as any).user?.id,
        memberId: req.body.userId,
        action: 'add_group_member_error'
      });
      res.status(500).json({ message: 'خطا در افزودن عضو به گروه' });
    }
  };

  /**
   * بروزرسانی عضو گروه
   */
  public updateGroupMember = async (req: Request, res: Response) => {
    try {
      const { id, userId: memberId } = req.params;
      const { role } = req.body;
      const userId = (req as any).user.id;

      const group = await Group.findByPk(id);

      if (!group) {
        return res.status(404).json({ message: 'گروه یافت نشد' });
      }

      // بررسی دسترسی
      if (group.ownerId !== userId && (req as any).user.role !== 'admin') {
        const userMembership = await GroupMember.findOne({
          where: { groupId: id, userId, role: 'admin' }
        });

        if (!userMembership) {
          return res.status(403).json({ message: 'شما اجازه ویرایش اعضای این گروه را ندارید' });
        }
      }

      // یافتن عضویت
      const membership = await GroupMember.findOne({
        where: { groupId: id, userId: memberId }
      });

      if (!membership) {
        return res.status(404).json({ message: 'این کاربر عضو گروه نیست' });
      }

      // جلوگیری از تغییر نقش مالک گروه
      if (Number(memberId) === group.ownerId && role !== 'admin') {
        return res.status(400).json({ message: 'نقش مالک گروه نمی‌تواند تغییر کند' });
      }

      // بروزرسانی نقش
      await membership.update({ role });

      loggingClient.info('عضو گروه بروزرسانی شد', {
        groupId: id,
        userId,
        memberId,
        role,
        action: 'update_group_member'
      });

      res.json({
        message: 'نقش کاربر در گروه با موفقیت بروزرسانی شد',
        membership
      });
    } catch (error) {
      loggingClient.error('خطا در بروزرسانی عضو گروه', {
        error: error instanceof Error ? error.message : String(error),
        groupId: req.params.id,
        userId: (req as any).user?.id,
        memberId: req.params.userId,
        action: 'update_group_member_error'
      });
      res.status(500).json({ message: 'خطا در بروزرسانی عضو گروه' });
    }
  };

  /**
   * حذف عضو از گروه
   */
  public removeGroupMember = async (req: Request, res: Response) => {
    try {
      const { id, userId: memberId } = req.params;
      const userId = (req as any).user.id;

      const group = await Group.findByPk(id);

      if (!group) {
        return res.status(404).json({ message: 'گروه یافت نشد' });
      }

      // بررسی دسترسی
      const isSelf = Number(memberId) === userId;
      const isOwner = group.ownerId === userId;
      const isAdmin = (req as any).user.role === 'admin';

      if (!isSelf && !isOwner && !isAdmin) {
        const userMembership = await GroupMember.findOne({
          where: { groupId: id, userId, role: 'admin' }
        });

        if (!userMembership) {
          return res.status(403).json({ message: 'شما اجازه حذف اعضای این گروه را ندارید' });
        }
      }

      // جلوگیری از حذف مالک گروه
      if (Number(memberId) === group.ownerId && !isAdmin) {
        return res.status(400).json({ message: 'مالک گروه نمی‌تواند از گروه حذف شود' });
      }

      // یافتن و حذف عضویت
      const membership = await GroupMember.findOne({
        where: { groupId: id, userId: memberId }
      });

      if (!membership) {
        return res.status(404).json({ message: 'این کاربر عضو گروه نیست' });
      }

      await membership.destroy();

      loggingClient.info('عضو از گروه حذف شد', {
        groupId: id,
        userId,
        memberId,
        action: 'remove_group_member'
      });

      res.json({ message: 'کاربر با موفقیت از گروه حذف شد' });
    } catch (error) {
      loggingClient.error('خطا در حذف عضو از گروه', {
        error: error instanceof Error ? error.message : String(error),
        groupId: req.params.id,
        userId: (req as any).user?.id,
        memberId: req.params.userId,
        action: 'remove_group_member_error'
      });
      res.status(500).json({ message: 'خطا در حذف عضو از گروه' });
    }
  };

  /**
   * دریافت تصاویر اشتراک‌گذاری شده با گروه
   */
  public getGroupImages = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const group = await Group.findByPk(id);

      if (!group) {
        return res.status(404).json({ message: 'گروه یافت نشد' });
      }

      // بررسی عضویت در گروه
      const isMember = await GroupMember.findOne({
        where: { groupId: id, userId }
      });

      if (!isMember && group.ownerId !== userId && (req as any).user.role !== 'admin') {
        return res.status(403).json({ message: 'شما به این گروه دسترسی ندارید' });
      }

      // دریافت تصاویر اشتراک‌گذاری شده با گروه
      const shares = await ImageShare.findAndCountAll({
        where: { sharedWithGroup: id },
        include: [
          {
            model: Image,
            as: 'image',
            include: [
              {
                model: User,
                as: 'owner',
                attributes: ['id', 'fullName', 'avatar']
              }
            ]
          },
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'fullName', 'avatar']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      loggingClient.info('دریافت تصاویر گروه', {
        groupId: id,
        userId,
        count: shares.count,
        action: 'get_group_images'
      });

      res.json({
        shares: shares.rows,
        totalPages: Math.ceil(shares.count / Number(limit)),
        currentPage: Number(page),
        totalItems: shares.count
      });
    } catch (error) {
      loggingClient.error('خطا در دریافت تصاویر گروه', {
        error: error instanceof Error ? error.message : String(error),
        groupId: req.params.id,
        userId: (req as any).user?.id,
        action: 'get_group_images_error'
      });
      res.status(500).json({ message: 'خطا در دریافت تصاویر گروه' });
    }
  };

  /**
   * دریافت همه گروه‌ها (فقط برای ادمین)
   */
  public getAllGroups = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: groups } = await Group.findAndCountAll({
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'fullName', 'avatar']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      loggingClient.info('دریافت همه گروه‌ها توسط ادمین', {
        userId: (req as any).user.id,
        page,
        limit,
        count,
        action: 'admin_get_all_groups'
      });

      res.json({
        groups,
        totalPages: Math.ceil(count / Number(limit)),
        currentPage: Number(page),
        totalItems: count
      });
    } catch (error) {
      loggingClient.error('خطا در دریافت همه گروه‌ها', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'admin_get_all_groups_error'
      });
      res.status(500).json({ message: 'خطا در دریافت گروه‌ها' });
    }
  };
}

export default GroupController; 