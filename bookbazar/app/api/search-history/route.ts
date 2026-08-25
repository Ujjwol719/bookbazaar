import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"
import { z } from "zod"

const schema = z.object({ query: z.string().trim().min(1).max(120) })

export async function POST(req: Request) {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const result = schema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data" }, { status: 400 })
  }

  await prisma.searchHistoryEntry.create({
    data: { userId: user.id, query: result.data.query },
  })

  return Response.json({ message: "Tracked" }, { status: 201 })
}
