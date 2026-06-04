import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  markOneRead,
} from "../repositories/notifications.repository.js";

const getUserId = (req: Request) => {
  if (!req.user?.id) throw new ApiError(401, "Unauthorized");
  return req.user.id;
};

export const listNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(userId),
      getUnreadCount(userId),
    ]);
    return res.status(200).json(
      new ApiResponse(200, { notifications, unreadCount }, "Notifications fetched"),
    );
  },
);

export const markAllNotificationsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    await markAllRead(userId);
    return res.status(200).json(
      new ApiResponse(200, null, "Marked all as read"),
    );
  },
);

export const markNotificationRead = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    if (Number.isNaN(id)) throw new ApiError(400, "Invalid notification id");
    await markOneRead(id, userId);
    return res.status(200).json(
      new ApiResponse(200, null, "Marked as read"),
    );
  },
);
