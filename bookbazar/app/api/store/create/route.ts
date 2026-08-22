import {z} from "zod"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import { decrypt } from "@/app/lib/session"
import { resend } from "@/lib/resend/resend"
import { generateUniqueStoreSlug } from "@/lib/slug"
 const storeSchema = z.object({
  storename: z
    .string()
    .min(3, "Store name must be at least 3 characters")
    .max(50, "Store name too long"),

  description: z
    .string()
    .min(10, "Description too short")
    .max(500, "Description too long"),

  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,15}$/, "Invalid phone number"),

  identityUrl: z
    .string()
    .url("Identity document is required")
})

export async function POST(req:Request)
{
    const body= await req.json()

const result = storeSchema.safeParse(body)

if (!result.success) {
  return Response.json(
    {
      message: "Validation failed",
      errors: result.error
    },
    {
      status: 400
    }
  )
}

const{storename,description,phone,identityUrl}= result.data


const  cookieStore=await cookies()
  
const sessionCookie=cookieStore.get("session")?.value
   if (!sessionCookie) {
      return Response.json(
        {
          message: "Unauthorized"
        },
        {
          status: 401
        }
      )
    }

    const payload=await decrypt(sessionCookie)

    if (!payload) {
      return Response.json(
        {
          message: "Invalid session"
        },
        {
          status: 401
        }
      )
    }

    if (payload.role !== "SELLER") {
      return Response.json(
        {
          message: "Only sellers can create a store"
        },
        {
          status: 403
        }
      )
    }



    const existingStore=await prisma.store.findUnique({

        where:{

            sellerId:payload.id as string
        }
    })


   if (existingStore) {
      return Response.json(
        {
          message: "Store already exists"
        },
        {
          status: 409
        }
      )
    }

const slug = await generateUniqueStoreSlug(storename)


    const store =
      await prisma.store.create({
        data: {
          sellerId: payload.id as string,
          name: storename,
          slug,
          description,
          phone,
          identityUrl,
          isActive: false,
          isApproved: false
        }
      })

    const adminEmail = process.env.ADMIN_EMAIL

    if (adminEmail) {
      await resend.emails.send({
        from: "BookMandu <noreply@krishalkarna.com.np>",
        to: adminEmail,
        subject: "New seller approval request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
            <h2>New seller submitted onboarding</h2>
            <p><strong>Seller:</strong> ${payload.email}</p>
            <p><strong>Store:</strong> ${store.name}</p>
            <p><strong>Phone:</strong> ${store.phone}</p>
            <p><strong>Identity document:</strong> <a href="${store.identityUrl}">View document</a></p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/admin">Open admin panel</a></p>
          </div>
        `,
      })
    }






  return Response.json(
      {
        message: "Store submitted successfully. BookMandu admin will review your identity before approving your store.",
        store
      },
      {
        status: 201
      }
    )

  
  }
