import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const createSchema = z.object({
  programId: z.string().min(1, "Program is required"),
  number: z.number().int().min(1).max(12),
  label: z.string().min(1).max(40).optional(),
})

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const programId = new URL(req.url).searchParams.get("programId") || undefined

  const semesters = await prisma.semester.findMany({
    where: programId ? { programId } : undefined,
    orderBy: { number: "asc" },
    include: { _count: { select: { programSubjects: true } } },
  })

  return Response.json({ semesters })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const result = createSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const { programId, number, label } = result.data

  const program = await prisma.program.findUnique({ where: { id: programId } })
  if (!program) {
    return Response.json({ message: "Program not found" }, { status: 404 })
  }

  const existing = await prisma.semester.findUnique({ where: { programId_number: { programId, number } } })
  if (existing) {
    return Response.json({ message: `Semester ${number} already exists for this program` }, { status: 409 })
  }

  const semester = await prisma.semester.create({
    data: { programId, number, label: label || `Semester ${number}` },
  })

  return Response.json({ message: "Semester added", semester }, { status: 201 })
}
