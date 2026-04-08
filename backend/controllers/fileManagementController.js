import asyncHandler from "../middlewares/asyncHandler.js";
import {
  getDownloadPresignedUrl,
  getViewPresignedUrl,
} from "../services/fileManagement/index.js";

export const redirectToViewUrl = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const url = await getViewPresignedUrl(fileId);
  res.redirect(302, url);
});

export const redirectToDownloadUrl = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const url = await getDownloadPresignedUrl(fileId);
  res.redirect(302, url);
});
