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

const bannerSchema = z.object({
  imageUrl: z.string().url('A banner image is required'),
  title: z.string().max(80).optional().nullable(),
  subtitle: z.string().max(160).optional().nullable(),
  linkUrl: z.string().url('Invalid link URL').optional().nullable().or(z.literal('')),
})

export async function GET() {
  const { error } = await requireAdmin()

  if (error) {
    return error
  }

  const banners = await prisma.banner.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  return Response.json({ banners })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()

  if (error) {
    return error
  }

  const body = await req.json()
  const result = bannerSchema.safeParse(body)

  if (!result.success) {
    return Response.json({ message: 'Invalid banner data', errors: result.error.flatten() }, { status: 400 })
  }

  const { imageUrl, title, subtitle, linkUrl } = result.data

  // New banners go to the end of the display order by default.
  const last = await prisma.banner.findFirst({ orderBy: { sortOrder: 'desc' } })

  const banner = await prisma.banner.create({
    data: {
      imageUrl,
      title: title || null,
      subtitle: subtitle || null,
      linkUrl: linkUrl || null,
      sortOrder: last ? last.sortOrder + 1 : 0,
    },
  })

  return Response.json({ message: 'Banner added', banner }, { status: 201 })
}
