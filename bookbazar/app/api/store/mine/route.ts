import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"

// Lets the seller dashboard show "here's your store URL" without the
// seller having to remember or dig for their own slug.
export async function GET() {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const store = await prisma.store.findUnique({
    where: { sellerId: user.id },
    select: { name: true, slug: true, isApproved: true, isVerified: true },
  })

  return Response.json({ store })
}
