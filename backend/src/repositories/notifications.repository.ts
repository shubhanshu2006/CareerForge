import { prisma } from "../config/prisma.js";

export const getNotifications = (userId: number, limit = 30) =>
  prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      createdAt: true,
    },
  });

export const getUnreadCount = (userId: number) =>
  prisma.notification.count({ where: { userId, isRead: false } });

export const markAllRead = (userId: number) =>
  prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

export const markOneRead = (notificationId: number, userId: number) =>
  prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
