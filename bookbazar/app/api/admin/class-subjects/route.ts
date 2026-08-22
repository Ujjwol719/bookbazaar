import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const createSchema = z.object({
  schoolClassId: z.string().min(1),
  subjectId: z.string().min(1),
  streamId: z.string().min(1).optional().nullable(),
})

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const schoolClassId = new URL(req.url).searchParams.get("schoolClassId") || undefined

  const classSubjects = await prisma.classSubject.findMany({
    where: schoolClassId ? { schoolClassId } : undefined,
    include: { subject: true, stream: true, schoolClass: true },
    orderBy: { subject: { name: "asc" } },
  })

  return Response.json({ classSubjects })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const result = createSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const { schoolClassId, subjectId, streamId } = result.data

  const schoolClass = await prisma.schoolClass.findUnique({ where: { id: schoolClassId } })
  if (!schoolClass) {
    return Response.json({ message: "Class not found" }, { status: 404 })
  }

  if (schoolClass.hasStreams && !streamId) {
    return Response.json({ message: `${schoolClass.name} requires a stream` }, { status: 400 })
  }
  if (!schoolClass.hasStreams && streamId) {
    return Response.json({ message: `${schoolClass.name} does not use streams` }, { status: 400 })
  }

  // Postgres treats every NULL as distinct, so the DB's own unique index
  // won't catch a duplicate (class, subject, streamId: null) row — check
  // for it explicitly here instead.
  const existing = await prisma.classSubject.findFirst({
    where: { schoolClassId, subjectId, streamId: streamId ?? null },
  })
  if (existing) {
    return Response.json({ message: "This subject is already assigned here" }, { status: 409 })
  }

  const classSubject = await prisma.classSubject.create({
    data: { schoolClassId, subjectId, streamId: streamId || null },
    include: { subject: true, stream: true },
  })

  return Response.json({ message: "Subject assigned", classSubject }, { status: 201 })
}
