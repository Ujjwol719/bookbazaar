import { decrypt } from "@/app/lib/session";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export  async function GET(res:Request)
{

    const cookieStore= await cookies()

    const session= cookieStore.get("session")?.value

    if(!session)
    {
        return Response.json(null)
    }
    const payload=await decrypt(session)

    if(!payload)
    {
        return Response.json(null)
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: {
            isBlocked: true,
            full_name: true,
        },
    })

    if (!user || user.isBlocked) {
        return Response.json(null)
    }

    // The JWT payload alone (id/email/role) never carried the display
    // name — the navbar needs it, so it's merged in here rather than
    // changing what's stored in the session cookie itself.
    return Response.json({ ...payload, full_name: user.full_name })



    
}