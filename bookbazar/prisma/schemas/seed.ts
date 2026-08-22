import "dotenv/config";
import slugify from "slugify";
import prisma from "../../lib/prisma";

// Standalone script — avoids importing lib/slug.ts, which pulls in the
// Next.js-only "server-only" package that has no meaning outside the
// Next runtime.
function generateSlug(title: string) {
  return slugify(title, { lower: true, strict: true, trim: true }) || "item";
}

// Study Hub reference data. This is a starting point, not the source of
// truth — every row here stays admin-editable (add/edit/disable/delete)
// through the Academic Management screens, per the product spec.

const SCHOOL_CLASSES = Array.from({ length: 12 }, (_, i) => {
  const level = i + 1;
  return { level, name: `Class ${level}`, hasStreams: level === 11 || level === 12 };
});

const STREAMS = ["Science", "Management", "Humanities", "Education"];

const UNIVERSITIES = [
  "Tribhuvan University",
  "Kathmandu University",
  "Pokhara University",
  "Purbanchal University",
  "Mid-West University",
  "Far Western University",
  "Lumbini Buddhist University",
  "Nepal Sanskrit University",
  "Agriculture and Forestry University",
  "Nepal Open University",
  "Rajarshi Janak University",
  "Gandaki University",
  "Manmohan Technical University",
];

async function main() {
  for (const schoolClass of SCHOOL_CLASSES) {
    await prisma.schoolClass.upsert({
      where: { level: schoolClass.level },
      update: { name: schoolClass.name, hasStreams: schoolClass.hasStreams },
      create: schoolClass,
    });
  }
  console.log(`Seeded ${SCHOOL_CLASSES.length} school classes.`);

  for (const name of STREAMS) {
    await prisma.stream.upsert({
      where: { name },
      update: {},
      create: { name, slug: generateSlug(name) },
    });
  }
  console.log(`Seeded ${STREAMS.length} streams.`);

  for (const name of UNIVERSITIES) {
    const slug = generateSlug(name);
    await prisma.university.upsert({
      where: { name },
      update: { slug },
      create: { name, slug },
    });
  }
  console.log(`Seeded ${UNIVERSITIES.length} universities.`);

  console.log("No programs, semesters, or subjects were seeded — add those from Admin → Academic Management once real, verified offerings are confirmed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
