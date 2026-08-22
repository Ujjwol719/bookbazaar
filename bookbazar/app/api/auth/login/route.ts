import {z} from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { encrypt } from '@/app/lib/session'
import redis from '@/lib/redis/redis'
import { NextRequest } from 'next/server'
import { sendVerificationEmail } from '@/lib/resend/sendverificationemail'
import { randomBytes } from 'crypto'

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "password must be of 8 integers")
})

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const body = await req.json()
  const result = loginSchema.safeParse(body)

  if (!result.success) {
    return Response.json({ message: result.error.message }, { status: 401 })
  }

  const attempts = await redis.get(`login:${result.data.email}`)
  if (Number(attempts) >= 5) {
    return Response.json({ message: "Too many login attempts" }, { status: 429 })
  }

  const user = await prisma.user.findUnique({
    where: { email: result.data.email },
    select: {
      id: true,
      email: true,
      full_name: true,
      password_hash: true,
      role: true,
      isVerified: true,
      isBlocked: true,
    }
  })

  if (!user) {
    return Response.json({ message: "No user found" }, { status: 404 })
  }

  if (user.isBlocked) {
    return Response.json({ message: "Your account is blocked. Contact support." }, { status: 403 })
  }

  if (!user.isVerified) {
    const existingToken = await prisma.verificationToken.findFirst({ 
        where: { userId: user.id } 
    })

    if (!existingToken) {
        const tokenx = randomBytes(32).toString('hex')
        await prisma.verificationToken.create({
            data: {
                token: tokenx,
                userId: user.id,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        })
        await sendVerificationEmail(result.data.email, tokenx, user.full_name)
    }

    return Response.json({
        message: "Please verify your email. Check your inbox."
    }, { status: 403 })
}

  if (!user.password_hash) {
    return Response.json(
      { message: "This account signs in with Google. Use the \"Continue with Google\" button instead." },
      { status: 401 }
    )
  }

  const validation = await bcrypt.compare(result.data.password, user.password_hash)
  if (!validation) {
    const newCount = await redis.incr(`login:${result.data.email}`)
    if (newCount === 1) {
      await redis.expire(`login:${result.data.email}`, 900)
    }
    return Response.json({ message: "Wrong password" }, { status: 401 })
  }

  const store = await prisma.store.findUnique({
    where: { sellerId: user.id }
  })

  const session = {
    id: user.id,
    email: user.email,
    role: user.role,
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const token = await encrypt(session)

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })

  return Response.json({
    message: "Successfully logged in",
    role: user.role,
    email: user.email,
    hasStore: !!store
  })
}