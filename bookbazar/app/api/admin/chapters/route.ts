import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { z } from "zod"

const createSchema = z.object({
  subjectId: z.string().min(1),
  title: z.string().min(1).max(120),
  sortOrder: z.number().int().optional(),
})

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const subjectId = new URL(req.url).searchParams.get("subjectId") || undefined

  const chapters = await prisma.chapter.findMany({
    where: subjectId ? { subjectId } : undefined,
    include: { _count: { select: { studyMaterials: true } } },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  })

  return Response.json({ chapters })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const result = createSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const { subjectId, title, sortOrder } = result.data

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } })
  if (!subject) {
    return Response.json({ message: "Subject not found" }, { status: 404 })
  }

  const chapter = await prisma.chapter.create({
    data: { subjectId, title, sortOrder: sortOrder ?? 0 },
  })

  return Response.json({ chapter }, { status: 201 })
}
