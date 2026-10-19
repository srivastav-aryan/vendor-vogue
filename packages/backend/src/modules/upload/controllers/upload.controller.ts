import { Request, Response, NextFunction } from "express";
import { UploadService } from "../services/upload.service.js";

export const uploadControllerCreator = (uploadService: UploadService) => ({
  getUploadSignature(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    try {
      const folder = (req.body?.folder || req.query?.folder) as string | undefined;
      const signatureData = uploadService.generateSignature(folder);

      res.status(200).json({
        success: true,
        data: signatureData,
      });
    } catch (error) {
      next(error);
    }
  },
});
