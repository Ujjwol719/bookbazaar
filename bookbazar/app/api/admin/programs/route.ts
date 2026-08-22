import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { generateSlug } from "@/lib/slug"
import { z } from "zod"

const createSchema = z.object({
  universityId: z.string().min(1, "University is required"),
  name: z.string().min(2, "Name is required").max(120),
  totalSemesters: z.number().int().min(1).max(12).optional(),
})

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const universityId = new URL(req.url).searchParams.get("universityId") || undefined

  const programs = await prisma.program.findMany({
    where: universityId ? { universityId } : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { semesters: true } } },
  })

  return Response.json({ programs })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const result = createSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const { universityId, name, totalSemesters } = result.data
  const slug = generateSlug(name)

  const university = await prisma.university.findUnique({ where: { id: universityId } })
  if (!university) {
    return Response.json({ message: "University not found" }, { status: 404 })
  }

  const existing = await prisma.program.findFirst({ where: { universityId, slug } })
  if (existing) {
    return Response.json({ message: "This university already has a program with that name" }, { status: 409 })
  }

  const program = await prisma.program.create({
    data: { universityId, name, slug, totalSemesters: totalSemesters ?? 8 },
  })

  return Response.json({ message: "Program added", program }, { status: 201 })
}
