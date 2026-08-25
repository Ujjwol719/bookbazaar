import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const book = await prisma.book.findFirst({
    where: { slug, isActive: true, store: { isActive: true, isApproved: true } },
    include: {
      category: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          isVerified: true,
          isApproved: true,
        },
      },
    },
  });

  if (!book) {
    return Response.json({ message: "Book not found" }, { status: 404 });
  }

  return Response.json({ book });
}