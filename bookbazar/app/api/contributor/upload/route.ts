import prisma from "@/lib/prisma"
import redis from "@/lib/redis/redis"
import { requireActiveUser } from "@/app/lib/active-user"
import { generateUniqueStudyMaterialSlug } from "@/lib/slug"
import { sha256 } from "@/lib/file-hash"
import { ALLOWED_FILE_TYPES, ALLOWED_THUMBNAIL_TYPES, MAX_FILE_BYTES, uploadStudyMaterialBuffer as uploadBuffer } from "@/lib/study-material-upload"

const DAILY_UPLOAD_LIMIT = 5

export async function POST(req: Request) {
  const { error, user } = await requireActiveUser()
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
  const suggestedChapterTitle = String(formData.get("suggestedChapterTitle") || "").trim() || null
  const ownershipConfirmed = formData.get("ownershipConfirmed") === "true"
  const resubmitMaterialId = String(formData.get("resubmitMaterialId") || "") || null

  if (!title || title.length > 150) {
    return Response.json({ message: "Title is required (max 150 characters)" }, { status: 400 })
  }
  if (type !== "NOTES" && type !== "QUESTION_PAPER") {
    return Response.json({ message: "Invalid material type" }, { status: 400 })
  }
  if (!!classSubjectId === !!programSubjectId) {
    return Response.json({ message: "Choose exactly one subject" }, { status: 400 })
  }
  if (!ownershipConfirmed) {
    return Response.json({ message: "You must confirm you own the rights to upload this content" }, { status: 400 })
  }

  // Permission check — the frontend only shows subjects the contributor is
  // permitted for, but that's a courtesy; this is the actual gate.
  const permission = await prisma.contributorPermission.findFirst({
    where: {
      userId: user.id,
      isActive: true,
      ...(classSubjectId ? { classSubjectId } : { programSubjectId }),
    },
    include: {
      classSubject: { select: { subjectId: true } },
      programSubject: { select: { subjectId: true } },
    },
  })
  if (!permission) {
    return Response.json({ message: "You don't have contributor access to this subject" }, { status: 403 })
  }
  const subjectId = permission.classSubject?.subjectId ?? permission.programSubject?.subjectId
  if (!subjectId) {
    return Response.json({ message: "Could not resolve the subject for this permission" }, { status: 500 })
  }

  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } })
    if (!chapter || chapter.subjectId !== subjectId) {
      return Response.json({ message: "Invalid chapter for this subject" }, { status: 400 })
    }
  }

  // Resubmission — only the owner, only if it needs work.
  let existingMaterial = null
  if (resubmitMaterialId) {
    existingMaterial = await prisma.studyMaterial.findUnique({ where: { id: resubmitMaterialId } })
    if (!existingMaterial || existingMaterial.uploadedById !== user.id) {
      return Response.json({ message: "Material not found" }, { status: 404 })
    }
    if (existingMaterial.status !== "REJECTED" && existingMaterial.status !== "CHANGES_REQUESTED") {
      return Response.json({ message: "This material isn't awaiting resubmission" }, { status: 409 })
    }
  } else {
    // Daily upload cap on *new* submissions only — resubmissions fixing
    // existing content don't count against it.
    const today = new Date().toISOString().slice(0, 10)
    const rateLimitKey = `contributor-upload:${user.id}:${today}`
    const count = await redis.get(rateLimitKey)
    if (count && Number(count) >= DAILY_UPLOAD_LIMIT) {
      return Response.json({ message: `You've reached today's upload limit (${DAILY_UPLOAD_LIMIT}). Try again tomorrow.` }, { status: 429 })
    }
  }

  if (!file) {
    return Response.json({ message: "A file is required" }, { status: 400 })
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
    const result = await uploadBuffer(buffer, {
      folder: "bookmandu/study-materials",
      resource_type: fileType === "PDF" ? "raw" : "image",
    })
    fileUrl = result.secure_url
  } catch (err) {
    console.error("STUDY MATERIAL UPLOAD ERROR:", err)
    return Response.json({ message: "Upload failed, please try again" }, { status: 500 })
  }

  let thumbnailUrl: string | undefined
  if (thumbnail && thumbnail.size > 0) {
    if (!ALLOWED_THUMBNAIL_TYPES.has(thumbnail.type)) {
      return Response.json({ message: "Thumbnail must be a JPG, PNG, or WEBP image" }, { status: 400 })
    }
    const thumbBuffer = Buffer.from(await thumbnail.arrayBuffer())
    const thumbResult = await uploadBuffer(thumbBuffer, { folder: "bookmandu/study-materials/thumbnails", resource_type: "image" })
    thumbnailUrl = thumbResult.secure_url
  }

  const finalChapterId = chapterId
  if (!finalChapterId && suggestedChapterTitle) {
    const suggestion = await prisma.chapterSuggestion.create({
      data: { subjectId, suggestedById: user.id, title: suggestedChapterTitle },
    })
    void suggestion // material still ships chapterless; admin reviews the suggestion separately
  }

  const material = existingMaterial
    ? await prisma.studyMaterial.update({
        where: { id: existingMaterial.id },
        data: {
          title,
          description: description || null,
          type: type as "NOTES" | "QUESTION_PAPER",
          fileUrl,
          fileType,
          thumbnailUrl: thumbnailUrl ?? existingMaterial.thumbnailUrl,
          chapterId: finalChapterId,
          fileHash,
          status: "PENDING",
          reviewNote: null,
          ownershipConfirmedAt: new Date(),
          slug: await generateUniqueStudyMaterialSlug(title, existingMaterial.id),
        },
      })
    : await prisma.studyMaterial.create({
        data: {
          title,
          slug: await generateUniqueStudyMaterialSlug(title),
          description: description || null,
          type: type as "NOTES" | "QUESTION_PAPER",
          fileUrl,
          fileType,
          thumbnailUrl,
          accessType: "FREE",
          status: "PENDING",
          classSubjectId,
          programSubjectId,
          chapterId: finalChapterId,
          uploadedById: user.id,
          fileHash,
          ownershipConfirmedAt: new Date(),
        },
      })

  if (!existingMaterial) {
    const today = new Date().toISOString().slice(0, 10)
    const rateLimitKey = `contributor-upload:${user.id}:${today}`
    const newCount = await redis.incr(rateLimitKey)
    if (newCount === 1) await redis.expire(rateLimitKey, 86400)
  }

  return Response.json(
    { message: "Submitted for review. You'll be notified once it's approved.", material },
    { status: existingMaterial ? 200 : 201 }
  )
}
