import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const createSchema = z.object({
  semesterId: z.string().min(1),
  subjectId: z.string().min(1),
})

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const semesterId = new URL(req.url).searchParams.get("semesterId") || undefined

  const programSubjects = await prisma.programSubject.findMany({
    where: semesterId ? { semesterId } : undefined,
    include: { subject: true, semester: { include: { program: true } } },
    orderBy: { subject: { name: "asc" } },
  })

  return Response.json({ programSubjects })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const result = createSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const { semesterId, subjectId } = result.data

  const semester = await prisma.semester.findUnique({ where: { id: semesterId } })
  if (!semester) {
    return Response.json({ message: "Semester not found" }, { status: 404 })
  }

  const existing = await prisma.programSubject.findUnique({
    where: { semesterId_subjectId: { semesterId, subjectId } },
  })
  if (existing) {
    return Response.json({ message: "This subject is already assigned here" }, { status: 409 })
  }

  const programSubject = await prisma.programSubject.create({
    data: { semesterId, subjectId },
    include: { subject: true },
  })

  return Response.json({ message: "Subject assigned", programSubject }, { status: 201 })
}
