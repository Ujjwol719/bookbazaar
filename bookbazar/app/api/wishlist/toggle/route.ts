import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"

export async function POST(req: Request) {
  const { error, user } = await requireActiveUser()

  if (error) {
    return error
  }

  const { bookId } = await req.json()

  if (!bookId) {
    return Response.json({ message: "bookId is required" }, { status: 400 })
  }

  const book = await prisma.book.findFirst({
    where: { id: bookId, isActive: true, store: { isActive: true } },
  })

  if (!book) {
    return Response.json({ message: "Book is not available" }, { status: 404 })
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_bookId: { userId: user.id, bookId } },
  })

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } })
    return Response.json({ message: "Removed from wishlist", wishlisted: false })
  }

  await prisma.wishlistItem.create({
    data: { userId: user.id, bookId },
  })

  return Response.json({ message: "Added to wishlist", wishlisted: true }, { status: 201 })
}
