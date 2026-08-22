import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { generateUniqueStudyMaterialSlug } from "@/lib/slug"
import { sha256 } from "@/lib/file-hash"
import { ALLOWED_FILE_TYPES, ALLOWED_THUMBNAIL_TYPES, MAX_FILE_BYTES, uploadStudyMaterialBuffer } from "@/lib/study-material-upload"

// Admin's own uploads publish immediately — admin is already the trust
// root for approving everyone else, so there's no separate review queue
// for admin-authored material. Contributor uploads (/api/contributor/upload)
// always start PENDING with no exceptions, including for an admin acting
// as a contributor through that route.
export async function POST(req: Request) {
  const { error, payload } = await requireAdmin()
  if (error) return error

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const thumbnail = formData.get("thumbnail") as File | null
  const title = String(formData.get("title") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const type = String(formData.get("type") || "NOTES")
  const classSubjectId = String(formData.get("classSubjectId") || "") || null
  const programSubjectId = String(formData.get("programSubjectId") || "") || null
  const chapterId = String(formData.get("chapterId") || "") || null

  if (!title || title.length > 150) {
    return Response.json({ message: "Title is required (max 150 characters)" }, { status: 400 })
  }
  if (type !== "NOTES" && type !== "QUESTION_PAPER") {
    return Response.json({ message: "Invalid material type" }, { status: 400 })
  }
  if (!!classSubjectId === !!programSubjectId) {
    return Response.json({ message: "Choose exactly one subject" }, { status: 400 })
  }
  if (!file) {
    return Response.json({ message: "A file is required" }, { status: 400 })
  }

  const target = classSubjectId
    ? await prisma.classSubject.findUnique({ where: { id: classSubjectId }, select: { subjectId: true } })
    : await prisma.programSubject.findUnique({ where: { id: programSubjectId! }, select: { subjectId: true } })
  if (!target) {
    return Response.json({ message: "Subject assignment not found" }, { status: 404 })
  }

  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } })
    if (!chapter || chapter.subjectId !== target.subjectId) {
      return Response.json({ message: "Invalid chapter for this subject" }, { status: 400 })
    }
  }

  const fileType = ALLOWED_FILE_TYPES[file.type]
  if (!fileType) {
    return Response.json({ message: "Only PDF, JPG, PNG, or WEBP files are allowed" }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ message: "File must be smaller than 20MB" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const fileHash = sha256(buffer)

  let fileUrl: string
  try {
    const result = await uploadStudyMaterialBuffer(buffer, {
      folder: "bookmandu/study-materials",
      resource_type: fileType === "PDF" ? "raw" : "image",
    })
    fileUrl = result.secure_url
  } catch (err) {
    console.error("ADMIN STUDY MATERIAL UPLOAD ERROR:", err)
    return Response.json({ message: "Upload failed, please try again" }, { status: 500 })
  }

  let thumbnailUrl: string | undefined
  if (thumbnail && thumbnail.size > 0) {
    if (!ALLOWED_THUMBNAIL_TYPES.has(thumbnail.type)) {
      return Response.json({ message: "Thumbnail must be a JPG, PNG, or WEBP image" }, { status: 400 })
    }
    const thumbBuffer = Buffer.from(await thumbnail.arrayBuffer())
    const thumbResult = await uploadStudyMaterialBuffer(thumbBuffer, { folder: "bookmandu/study-materials/thumbnails", resource_type: "image" })
    thumbnailUrl = thumbResult.secure_url
  }

  const material = await prisma.studyMaterial.create({
    data: {
      title,
      slug: await generateUniqueStudyMaterialSlug(title),
      description: description || null,
      type: type as "NOTES" | "QUESTION_PAPER",
      fileUrl,
      fileType,
      thumbnailUrl,
      accessType: "FREE",
      status: "APPROVED", // bypasses the review queue — see comment above
      classSubjectId,
      programSubjectId,
      chapterId,
      uploadedById: payload!.id as string,
      fileHash,
      ownershipConfirmedAt: new Date(),
    },
  })

  return Response.json({ message: "Published to Study Hub", material }, { status: 201 })
}
