import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"
import { z } from "zod"

const schema = z.object({ bookId: z.string().min(1) })

// One row per (user, book) — re-viewing just bumps viewedAt via upsert,
// it doesn't pile up duplicate history rows.
export async function POST(req: Request) {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const result = schema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data" }, { status: 400 })
  }

  const book = await prisma.book.findUnique({ where: { id: result.data.bookId }, select: { id: true } })
  if (!book) {
    return Response.json({ message: "Book not found" }, { status: 404 })
  }

  await prisma.recentlyViewedBook.upsert({
    where: { userId_bookId: { userId: user.id, bookId: book.id } },
    update: { viewedAt: new Date() },
    create: { userId: user.id, bookId: book.id },
  })

  return Response.json({ message: "Tracked" })
}
