import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"
import { z } from "zod"

// Lets the seller dashboard show "here's your store URL", its approval/
// verification status, and its own description without the seller having
// to dig for any of it.
export async function GET() {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const store = await prisma.store.findUnique({
    where: { sellerId: user.id },
    select: { name: true, slug: true, description: true, isActive: true, isApproved: true, isVerified: true },
  })

  return Response.json({ store })
}

const patchSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description too long"),
})

// Sellers could set a description once at onboarding but never edit it
// again — this is the missing "change it later" endpoint. Deliberately
// narrow: only description, not name/approval/verification — those stay
// admin-controlled.
export async function PATCH(req: Request) {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const result = patchSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: result.error.issues[0]?.message || "Invalid data" }, { status: 400 })
  }

  const store = await prisma.store.findUnique({ where: { sellerId: user.id } })
  if (!store) {
    return Response.json({ message: "You don't have a store yet" }, { status: 404 })
  }

  const updated = await prisma.store.update({
    where: { id: store.id },
    data: { description: result.data.description },
    select: { name: true, slug: true, description: true, isActive: true, isApproved: true, isVerified: true },
  })

  return Response.json({ message: "Store description updated", store: updated })
}
