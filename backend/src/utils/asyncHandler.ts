import type { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler =
  (requestHandler: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
