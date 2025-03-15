import { Request, Response } from 'express';
import { Image, ImageShare, User, Group } from '../models';
import path from 'path';
import fs from 'fs';
import { loggingClient } from '../utils/logging-client';
import { v4 as uuidv4 } from 'uuid';

class ImageController {
  /**
   * دریافت تصاویر عمومی
   */
  public getPublicImages = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: images } = await Image.findAndCountAll({
        where: { isPublic: true },
        limit: Number(limit),
        offset,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'fullName', 'avatar']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      loggingClient.info('دریافت تصاویر عمومی', {
        page,
        limit,
        count,
        action: 'get_public_images'
      });

      res.json({
        images,
        totalPages: Math.ceil(count / Number(limit)),
        currentPage: Number(page),
        totalItems: count
      });
    } catch (error) {
      loggingClient.error('خطا در دریافت تصاویر عمومی', {
        error: error instanceof Error ? error.message : String(error),
        action: 'get_public_images_error'
      });
      res.status(500).json({ message: 'خطا در دریافت تصاویر عمومی' });
    }
  };

  /**
   * دریافت یک تصویر عمومی با شناسه
   */
  public getPublicImage = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const image = await Image.findOne({
        where: { id, isPublic: true },
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'fullName', 'avatar']
          }
        ]
      });

      if (!image) {
        return res.status(404).json({ message: 'تصویر یافت نشد یا عمومی نیست' });
      }

      // افزایش تعداد بازدید
      await image.update({ viewCount: image.viewCount + 1 });

      loggingClient.info('مشاهده تصویر عمومی', {
        imageId: image.id,
        userId: (req as any).user?.id || 'anonymous',
        action: 'view_public_image'
      });

      res.json(image);
    } catch (error) {
      loggingClient.error('خطا در دریافت تصویر عمومی', {
        error: error instanceof Error ? error.message : String(error),
        imageId: req.params.id,
        action: 'get_public_image_error'
      });
      res.status(500).json({ message: 'خطا در دریافت تصویر عمومی' });
    }
  };

  /**
   * دریافت تصاویر کاربر لاگین شده
   */
  public getMyImages = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: images } = await Image.findAndCountAll({
        where: { ownerId: userId },
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      loggingClient.info('دریافت تصاویر کاربر', {
        userId,
        page,
        limit,
        count,
        action: 'get_user_images'
      });

      res.json({
        images,
        totalPages: Math.ceil(count / Number(limit)),
        currentPage: Number(page),
        totalItems: count
      });
    } catch (error) {
      loggingClient.error('خطا در دریافت تصاویر کاربر', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'get_user_images_error'
      });
      res.status(500).json({ message: 'خطا در دریافت تصاویر' });
    }
  };

  /**
   * آپلود تصویر جدید
   */
  public uploadImage = async (req: Request, res: Response) => {
    try {
      const { title, description, isPublic } = req.body;
      const userId = (req as any).user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'فایل تصویر الزامی است' });
      }

      if (!title) {
        return res.status(400).json({ message: 'عنوان تصویر الزامی است' });
      }

      // ذخیره اطلاعات تصویر در دیتابیس
      const image = await Image.create({
        title,
        description,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        ownerId: userId,
        isPublic: isPublic === 'true'
      });

      loggingClient.info('تصویر جدید آپلود شد', {
        imageId: image.id,
        userId,
        fileName: file.filename,
        fileSize: file.size,
        action: 'upload_image_success'
      });

      res.status(201).json({
        message: 'تصویر با موفقیت آپلود شد',
        image
      });
    } catch (error) {
      loggingClient.error('خطا در آپلود تصویر', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'upload_image_error'
      });
      res.status(500).json({ message: 'خطا در آپلود تصویر' });
    }
  };

  /**
   * دریافت یک تصویر با شناسه
   */
  public getImage = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const image = await Image.findByPk(id, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'fullName', 'avatar']
          }
        ]
      });

      if (!image) {
        return res.status(404).json({ message: 'تصویر یافت نشد' });
      }

      // بررسی دسترسی
      if (image.ownerId !== userId && !image.isPublic) {
        // بررسی اشتراک‌گذاری
        const share = await ImageShare.findOne({
          where: {
            imageId: id,
            sharedWith: userId
          }
        });

        // بررسی اشتراک‌گذاری گروهی
        const groupShare = await ImageShare.findOne({
          where: {
            imageId: id
          },
          include: [
            {
              model: Group,
              as: 'group',
              include: [
                {
                  model: User,
                  as: 'members',
                  where: { id: userId }
                }
              ]
            }
          ]
        });

        if (!share && !groupShare && (req as any).user.role !== 'admin') {
          return res.status(403).json({ message: 'شما به این تصویر دسترسی ندارید' });
        }
      }

      // افزایش تعداد بازدید
      await image.update({ viewCount: image.viewCount + 1 });

      loggingClient.info('مشاهده تصویر', {
        imageId: image.id,
        userId,
        action: 'view_image'
      });

      res.json(image);
    } catch (error) {
      loggingClient.error('خطا در دریافت تصویر', {
        error: error instanceof Error ? error.message : String(error),
        imageId: req.params.id,
        userId: (req as any).user?.id,
        action: 'get_image_error'
      });
      res.status(500).json({ message: 'خطا در دریافت تصویر' });
    }
  };

  /**
   * بروزرسانی اطلاعات تصویر
   */
  public updateImage = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, isPublic } = req.body;
      const userId = (req as any).user.id;

      const image = await Image.findByPk(id);

      if (!image) {
        return res.status(404).json({ message: 'تصویر یافت نشد' });
      }

      // بررسی مالکیت یا دسترسی ادمین
      if (image.ownerId !== userId && (req as any).user.role !== 'admin') {
        return res.status(403).json({ message: 'شما اجازه ویرایش این تصویر را ندارید' });
      }

      // بروزرسانی اطلاعات
      await image.update({
        title,
        description,
        isPublic: isPublic === 'true'
      });

      loggingClient.info('اطلاعات تصویر بروزرسانی شد', {
        imageId: image.id,
        userId,
        action: 'update_image_success'
      });

      res.json({
        message: 'تصویر با موفقیت بروزرسانی شد',
        image
      });
    } catch (error) {
      loggingClient.error('خطا در بروزرسانی تصویر', {
        error: error instanceof Error ? error.message : String(error),
        imageId: req.params.id,
        userId: (req as any).user?.id,
        action: 'update_image_error'
      });
      res.status(500).json({ message: 'خطا در بروزرسانی تصویر' });
    }
  };

  /**
   * حذف تصویر
   */
  public deleteImage = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const image = await Image.findByPk(id);

      if (!image) {
        return res.status(404).json({ message: 'تصویر یافت نشد' });
      }

      // بررسی مالکیت
      if (image.ownerId !== userId && (req as any).user.role !== 'admin') {
        return res.status(403).json({ message: 'شما اجازه حذف این تصویر را ندارید' });
      }

      // حذف فایل فیزیکی
      const filePath = image.filePath;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // حذف از دیتابیس
      await image.destroy();

      loggingClient.info('تصویر حذف شد', {
        imageId: id,
        userId,
        action: 'delete_image_success'
      });

      res.json({ message: 'تصویر با موفقیت حذف شد' });
    } catch (error) {
      loggingClient.error('خطا در حذف تصویر', {
        error: error instanceof Error ? error.message : String(error),
        imageId: req.params.id,
        userId: (req as any).user?.id,
        action: 'delete_image_error'
      });
      res.status(500).json({ message: 'خطا در حذف تصویر' });
    }
  };

  /**
   * اشتراک‌گذاری تصویر
   */
  public shareImage = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { sharedWithUserId, sharedWithGroupId, accessLevel, expiresAt } = req.body;
      const userId = (req as any).user.id;

      if (!sharedWithUserId && !sharedWithGroupId) {
        return res.status(400).json({ message: 'شناسه کاربر یا گروه برای اشتراک‌گذاری الزامی است' });
      }

      const image = await Image.findByPk(id);

      if (!image) {
        return res.status(404).json({ message: 'تصویر یافت نشد' });
      }

      // بررسی مالکیت
      if (image.ownerId !== userId && (req as any).user.role !== 'admin') {
        return res.status(403).json({ message: 'شما اجازه اشتراک‌گذاری این تصویر را ندارید' });
      }

      // ایجاد لینک اشتراک‌گذاری
      const shareLink = `${process.env.SERVER_URL || 'http://localhost:3010'}/api/images/share/${uuidv4()}`;

      // ایجاد اشتراک‌گذاری
      const share = await ImageShare.create({
        imageId: id,
        sharedBy: userId,
        sharedWith: sharedWithUserId,
        sharedWithGroup: sharedWithGroupId,
        accessLevel: accessLevel || 'view',
        shareLink,
        expiresAt: expiresAt || null
      });

      loggingClient.info('تصویر به اشتراک گذاشته شد', {
        imageId: id,
        userId,
        sharedWith: sharedWithUserId,
        sharedWithGroup: sharedWithGroupId,
        action: 'share_image_success'
      });

      res.status(201).json({
        message: 'تصویر با موفقیت به اشتراک گذاشته شد',
        share
      });
    } catch (error) {
      loggingClient.error('خطا در اشتراک‌گذاری تصویر', {
        error: error instanceof Error ? error.message : String(error),
        imageId: req.params.id,
        userId: (req as any).user?.id,
        action: 'share_image_error'
      });
      res.status(500).json({ message: 'خطا در اشتراک‌گذاری تصویر' });
    }
  };

  /**
   * دریافت اشتراک‌های یک تصویر
   */
  public getImageShares = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const image = await Image.findByPk(id);

      if (!image) {
        return res.status(404).json({ message: 'تصویر یافت نشد' });
      }

      // بررسی مالکیت
      if (image.ownerId !== userId && (req as any).user.role !== 'admin') {
        return res.status(403).json({ message: 'شما به اشتراک‌های این تصویر دسترسی ندارید' });
      }

      // دریافت اشتراک‌ها
      const shares = await ImageShare.findAll({
        where: { imageId: id },
        include: [
          {
            model: User,
            as: 'recipient',
            attributes: ['id', 'fullName', 'avatar']
          },
          {
            model: Group,
            as: 'group',
            attributes: ['id', 'name']
          }
        ]
      });

      loggingClient.info('دریافت اشتراک‌های تصویر', {
        imageId: id,
        userId,
        sharesCount: shares.length,
        action: 'get_image_shares'
      });

      res.json(shares);
    } catch (error) {
      loggingClient.error('خطا در دریافت اشتراک‌های تصویر', {
        error: error instanceof Error ? error.message : String(error),
        imageId: req.params.id,
        userId: (req as any).user?.id,
        action: 'get_image_shares_error'
      });
      res.status(500).json({ message: 'خطا در دریافت اشتراک‌های تصویر' });
    }
  };

  /**
   * حذف اشتراک تصویر
   */
  public removeImageShare = async (req: Request, res: Response) => {
    try {
      const { id, shareId } = req.params;
      const userId = (req as any).user.id;

      const image = await Image.findByPk(id);

      if (!image) {
        return res.status(404).json({ message: 'تصویر یافت نشد' });
      }

      // بررسی مالکیت
      if (image.ownerId !== userId && (req as any).user.role !== 'admin') {
        return res.status(403).json({ message: 'شما اجازه حذف اشتراک این تصویر را ندارید' });
      }

      // یافتن و حذف اشتراک
      const share = await ImageShare.findOne({
        where: { id: shareId, imageId: id }
      });

      if (!share) {
        return res.status(404).json({ message: 'اشتراک یافت نشد' });
      }

      await share.destroy();

      loggingClient.info('اشتراک تصویر حذف شد', {
        imageId: id,
        shareId,
        userId,
        action: 'remove_image_share'
      });

      res.json({ message: 'اشتراک با موفقیت حذف شد' });
    } catch (error) {
      loggingClient.error('خطا در حذف اشتراک تصویر', {
        error: error instanceof Error ? error.message : String(error),
        imageId: req.params.id,
        shareId: req.params.shareId,
        userId: (req as any).user?.id,
        action: 'remove_image_share_error'
      });
      res.status(500).json({ message: 'خطا در حذف اشتراک تصویر' });
    }
  };

  /**
   * دریافت همه تصاویر (فقط برای ادمین)
   */
  public getAllImages = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: images } = await Image.findAndCountAll({
        limit: Number(limit),
        offset,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'fullName', 'avatar']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      loggingClient.info('دریافت همه تصاویر توسط ادمین', {
        userId: (req as any).user.id,
        page,
        limit,
        count,
        action: 'admin_get_all_images'
      });

      res.json({
        images,
        totalPages: Math.ceil(count / Number(limit)),
        currentPage: Number(page),
        totalItems: count
      });
    } catch (error) {
      loggingClient.error('خطا در دریافت همه تصاویر', {
        error: error instanceof Error ? error.message : String(error),
        userId: (req as any).user?.id,
        action: 'admin_get_all_images_error'
      });
      res.status(500).json({ message: 'خطا در دریافت تصاویر' });
    }
  };

  /**
   * حذف تصویر توسط ادمین
   */
  public adminDeleteImage = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const image = await Image.findByPk(id);

      if (!image) {
        return res.status(404).json({ message: 'تصویر یافت نشد' });
      }

      // حذف فایل فیزیکی
      const filePath = image.filePath;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // حذف از دیتابیس
      await image.destroy();

      loggingClient.warn('تصویر توسط ادمین حذف شد', {
        imageId: id,
        adminId: userId,
        ownerId: image.ownerId,
        action: 'admin_delete_image'
      });

      res.json({ message: 'تصویر با موفقیت حذف شد' });
    } catch (error) {
      loggingClient.error('خطا در حذف تصویر توسط ادمین', {
        error: error instanceof Error ? error.message : String(error),
        imageId: req.params.id,
        userId: (req as any).user?.id,
        action: 'admin_delete_image_error'
      });
      res.status(500).json({ message: 'خطا در حذف تصویر' });
    }
  };
}

export default ImageController; 