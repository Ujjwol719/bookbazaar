import { decrypt } from "@/app/lib/session"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import { requireActiveUser } from "@/app/lib/active-user"
export async function POST(req:Request)
{

    const cookieStore= await cookies()

    const session=cookieStore.get("session")?.value

    if(!session)
    {

       return Response.json(
  {
    message: "Unauthorized"
  },
  {
    status: 401
  }
)
    }

const payload=await decrypt(session)

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

const { error } = await requireActiveUser()

if (error) {
  return error
}

    const {id}=payload
    const {bookID}= await req.json()

const book = await prisma.book.findFirst({
  where: {
    id: bookID,
    isActive: true,
    store: {
      isActive: true,
      isApproved: true
    }
  }
})

if (!book) {
  return Response.json(
    {
      message: "Book is not available"
    },
    {
      status: 404
    }
  )
}

const existing= await prisma.cartItem.findUnique({

    where:{
        userId_bookId:{
            userId:id as string,
            bookId:bookID
        }


    }
})

if(existing)
{
const updatecartitems=await prisma.cartItem.update({
    where:{
        id:existing.id
    },
    data:{
        quantity:{
            increment:1
        }
    }
})
 return Response.json({
      message: "Cart updated",
      cartItem: updatecartitems
    })
  }




    const cartitems=await prisma.cartItem.create({
    
data:{

   userId:id as string,
   bookId:bookID,
   quantity:1,

}

    })

  return Response.json(
    {
      message: "Book added to cart",
      cartitems
    },
    {
      status: 201,
    }
  )
}
