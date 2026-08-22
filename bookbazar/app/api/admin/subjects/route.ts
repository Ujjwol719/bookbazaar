import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { generateSlug } from "@/lib/slug"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
})

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { classSubjects: true, programSubjects: true } } },
  })

  return Response.json({ subjects })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const result = createSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const { name } = result.data
  const slug = generateSlug(name)

  const existing = await prisma.subject.findUnique({ where: { slug } })
  if (existing) {
    return Response.json({ message: "This subject already exists — reuse it instead of duplicating." }, { status: 409 })
  }

  const subject = await prisma.subject.create({ data: { name, slug } })
  return Response.json({ message: "Subject added", subject }, { status: 201 })
}
