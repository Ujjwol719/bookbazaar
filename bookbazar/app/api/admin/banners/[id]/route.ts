import { decrypt } from '@/app/lib/session'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { z } from 'zod'

async function requireAdmin() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value

  if (!sessionCookie) {
    return { error: Response.json({ message: 'Unauthorized' }, { status: 401 }) }
  }

  const payload = await decrypt(sessionCookie)

  if (!payload || payload.role !== 'ADMIN') {
    return { error: Response.json({ message: 'Admin access only' }, { status: 403 }) }
  }

  return { payload }
}

const updateSchema = z.object({
  title: z.string().max(80).optional().nullable(),
  subtitle: z.string().max(160).optional().nullable(),
  linkUrl: z.string().url('Invalid link URL').optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()

  if (error) {
    return error
  }

  const { id } = await context.params
  const body = await req.json()
  const result = updateSchema.safeParse(body)

  if (!result.success) {
    return Response.json({ message: 'Invalid banner data', errors: result.error.flatten() }, { status: 400 })
  }

  const { title, subtitle, linkUrl, isActive, sortOrder } = result.data

  const banner = await prisma.banner.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title: title || null } : {}),
      ...(subtitle !== undefined ? { subtitle: subtitle || null } : {}),
      ...(linkUrl !== undefined ? { linkUrl: linkUrl || null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    },
  })

  return Response.json({ message: 'Banner updated', banner })
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin()

  if (error) {
    return error
  }

  const { id } = await context.params

  await prisma.banner.delete({ where: { id } })

  return Response.json({ message: 'Banner deleted' })
}
