import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { generateSlug } from "@/lib/slug"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(2, "Name is required").max(120),
  logoUrl: z.string().url().optional().nullable(),
})

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const universities = await prisma.university.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { programs: true } } },
  })

  return Response.json({ universities })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const result = createSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }

  const { name, logoUrl } = result.data
  const slug = generateSlug(name)

  const existing = await prisma.university.findFirst({ where: { OR: [{ name }, { slug }] } })
  if (existing) {
    return Response.json({ message: "A university with that name already exists" }, { status: 409 })
  }

  const university = await prisma.university.create({
    data: { name, slug, logoUrl: logoUrl || null },
  })

  return Response.json({ message: "University added", university }, { status: 201 })
}
