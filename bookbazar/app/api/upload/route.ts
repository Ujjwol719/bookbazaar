import { v2 as cloudinary } from 'cloudinary'
import { cookies } from 'next/headers'
import { decrypt } from '@/app/lib/session'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export async function POST(req: Request) {
  try {
    const sessionCookie = (await cookies()).get("session")?.value
    const payload = sessionCookie ? await decrypt(sessionCookie) : null

    if (!payload) {
      return Response.json({ message: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ message: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json({ message: "Only JPG, PNG, WEBP, or GIF images are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return Response.json({ message: "Image must be smaller than 10MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "bookmandu/books" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result as { secure_url: string });
          }
        )
        .end(buffer);
    });

    return Response.json({ url: uploadResult.secure_url });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}