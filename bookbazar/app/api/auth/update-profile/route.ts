import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"
import { z } from "zod"

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(80),
  phone: z.string().regex(/^\+?[0-9\s-]{7,15}$/, "Invalid phone number").optional().or(z.literal("")),
})

export async function PATCH(req: Request) {
  const { error, user } = await requireActiveUser()
  if (error) return error

  const result = schema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: result.error.issues[0]?.message || "Invalid data" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { full_name: result.data.full_name, phone: result.data.phone || null },
    select: { full_name: true, phone: true, email: true },
  })

  return Response.json({ message: "Profile updated", user: updated })
}
