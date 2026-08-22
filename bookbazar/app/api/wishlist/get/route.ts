import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"

export async function GET() {
  const { error, user } = await requireActiveUser()

  if (error) {
    return error
  }

  const items = await prisma.wishlistItem.findMany({
    where: {
      userId: user.id,
      book: { isActive: true, store: { isActive: true } },
    },
    include: { book: true },
    orderBy: { addedAt: "desc" },
  })

  return Response.json(items)
}
