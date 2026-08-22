import prisma from "@/lib/prisma"
import { requireAdmin } from "@/app/lib/require-admin"
import { getCreditSettings } from "@/lib/credits"
import { z } from "zod"

const patchSchema = z.object({
  creditValueInRupees: z.number().positive().max(1000).optional(),
  contributionReward: z.number().int().min(0).max(1000).optional(),
})

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const settings = await getCreditSettings()
  return Response.json({ settings })
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const result = patchSchema.safeParse(await req.json())
  if (!result.success) {
    return Response.json({ message: "Invalid data", errors: result.error.flatten() }, { status: 400 })
  }
  if (Object.keys(result.data).length === 0) {
    return Response.json({ message: "Nothing to update" }, { status: 400 })
  }

  const settings = await getCreditSettings()
  const updated = await prisma.creditSettings.update({ where: { id: settings.id }, data: result.data })
  return Response.json({ message: "Settings updated", settings: updated })
}
