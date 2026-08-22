import "server-only"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20MB
export const ALLOWED_FILE_TYPES: Record<string, "PDF" | "IMAGE"> = {
  "application/pdf": "PDF",
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
}
export const ALLOWED_THUMBNAIL_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export function uploadStudyMaterialBuffer(buffer: Buffer, options: { folder: string; resource_type: "raw" | "image" }) {
  return new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error)
      resolve(result as { secure_url: string })
    }).end(buffer)
  })
}
