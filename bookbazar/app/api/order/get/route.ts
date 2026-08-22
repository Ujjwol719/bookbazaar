import { decrypt } from "@/app/lib/session"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

export async function GET() {
  const sessionCookie = await cookies()
  const session = sessionCookie.get("session")?.value

  if (!session) {
    return Response.json({
      message: "unauthorized user"
    }, {
      status: 401
    })
  }

  const payload = await decrypt(session)

  if (!payload) {
    return Response.json({
      message: "invalid session"
    }, {
      status: 401
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id as string },
    select: { isBlocked: true }
  })

  if (!user) {
    return Response.json({
      message: "User not found"
    }, {
      status: 404
    })
  }

  if (user.isBlocked) {
    return Response.json({
      message: "Your account is blocked. Contact support."
    }, {
      status: 403
    })
  }

  const result = await prisma.order.findMany({
    where: {
      buyerId: payload.id as string
    },
    include: {
      items: {
        include: {
          book: true,
          // Only the fields a buyer needs to identify/contact the seller —
          // the store row also carries private fields like identityUrl (KYC
          // document) that must never reach a buyer's browser.
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              phone: true,
            },
          },
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  return Response.json(result)
}