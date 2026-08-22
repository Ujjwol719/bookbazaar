import "dotenv/config";
import prisma from "../../lib/prisma";

// A starting coupon — admin-editable from Admin -> Coupons afterward.
const COUPONS = [
  {
    code: "FIRST10",
    type: "PERCENTAGE" as const,
    value: 10,
    description: "10% off your first order",
    firstOrderOnly: true,
  },
];

async function main() {
  let created = 0;
  for (const c of COUPONS) {
    const existing = await prisma.coupon.findUnique({ where: { code: c.code } });
    if (existing) continue;
    await prisma.coupon.create({ data: c });
    created++;
  }
  console.log(`Done — ${created} coupon(s) created, ${COUPONS.length - created} already existed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
