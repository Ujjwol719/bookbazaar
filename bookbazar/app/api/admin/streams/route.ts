import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { generateSlug } from "@/lib/slug"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
})

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const streams = await prisma.stream.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { classSubjects: true } } },
  })

  return Response.json({ streams })
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

  const existing = await prisma.stream.findFirst({ where: { OR: [{ name }, { slug }] } })
  if (existing) {
    return Response.json({ message: "This stream already exists" }, { status: 409 })
  }

  const stream = await prisma.stream.create({ data: { name, slug } })
  return Response.json({ message: "Stream added", stream }, { status: 201 })
}
