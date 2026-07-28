import { Request, Response, NextFunction } from "express";
import { LandmarkService } from "../services/landmark.service.js";
import { sendSuccess } from "../utils/response.js";
import { ApiError } from "../utils/ApiError.js";

const landmarkService = new LandmarkService();

export class LandmarkController {
  /** GET /api/landmarks  — all landmarks (admin sees all; public sees visible only) */
  async getLandmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const publicOnly = req.query.visible === "true";
      const landmarks = publicOnly
        ? await landmarkService.getVisibleLandmarks()
        : await landmarkService.getLandmarks();

      return sendSuccess(
        res,
        { count: landmarks.length, landmarks },
        "Landmarks retrieved successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/landmarks/:id */
  async getLandmarkById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const landmark = await landmarkService.getLandmarkById(req.params.id);
      return sendSuccess(res, landmark, "Landmark retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/landmarks */
  async createLandmark(req: Request, res: Response, next: NextFunction) {
    try {
      const landmark = await landmarkService.createLandmark(req.body);
      return sendSuccess(res, landmark, "Landmark created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/landmarks/:id */
  async updateLandmark(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const landmark = await landmarkService.updateLandmark(req.params.id, req.body);
      return sendSuccess(res, landmark, "Landmark updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/landmarks/:id */
  async deleteLandmark(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      await landmarkService.deleteLandmark(req.params.id);
      return sendSuccess(res, null, "Landmark deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/landmarks/search?q=... */
  async searchLandmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) ?? "";
      if (!q.trim()) {
        throw new ApiError(400, "Search query must not be empty");
      }
      const results = await landmarkService.searchLandmarks(q);
      return sendSuccess(res, results, "Landmark search completed");
    } catch (error) {
      next(error);
    }
  }
}

export const landmarkController = new LandmarkController();
