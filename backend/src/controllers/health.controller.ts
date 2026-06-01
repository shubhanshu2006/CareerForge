import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const healthCheck = asyncHandler(
  async (_req: Request, res: Response) => {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          status: "UP",
        },
        "CareerForge API Running",
      ),
    );
  },
);
