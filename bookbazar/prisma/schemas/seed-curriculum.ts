import "dotenv/config";
import slugify from "slugify";
import prisma from "../../lib/prisma";

// Nepal school curriculum reference data — a starting point, not the final
// word. Every subject here stays admin-editable (add/edit/delete) from
// Academic Management; CDC revises curricula over time and coverage varies
// by school, so treat this as "enough to be useful," not "the" curriculum.

function slug(name: string) {
  return slugify(name, { lower: true, strict: true, trim: true }) || "subject";
}

const COMMON_1_3 = [
  "Nepali", "English", "Mathematics", "Science and Environment", "Social Studies",
  "Health, Physical and Creative Arts", "Computer / ICT", "Local Language", "Moral Education",
];

const COMMON_4_5 = [
  "Nepali", "English", "Mathematics", "Science and Technology", "Social Studies and Human Values Education",
  "Health, Physical and Creative Arts", "Computer / ICT", "Sanskrit", "Moral Education",
];

const COMMON_6_8 = [
  "Nepali", "English", "Mathematics", "Science and Technology", "Social Studies and Human Values Education",
  "Health and Physical Education", "Computer Science / ICT", "Creative Arts", "Sanskrit", "Local Language",
  "Optional Mathematics", "Agriculture Education", "Moral Education",
];

const CORE_9_10 = [
  "Nepali", "English", "Mathematics", "Science and Technology", "Social Studies",
  "Health, Physical and Creative Arts", "Computer Science / ICT",
];

// A conservative subset of the real optional catalog — vague catch-alls
// ("other vocational/technical subjects") were deliberately left out since
// they aren't real subject names; admin can add specific ones later.
const OPTIONAL_9_10 = [
  "Optional Mathematics", "Optional English", "Economics", "Accountancy", "Education",
  "Population Studies", "History", "Geography", "Political Science", "Sociology",
  "Sanskrit", "Agriculture",
];

const COMPULSORY_11_12 = ["Nepali", "English", "Social Studies / Life Skills"];

const STREAM_SUBJECTS: Record<string, string[]> = {
  Science: ["Physics", "Chemistry", "Biology", "Mathematics", "Computer Science"],
  Management: [
    "Accountancy", "Economics", "Business Studies", "Mathematics", "Business Mathematics",
    "Computer Science", "Hotel Management", "Marketing", "Finance", "Entrepreneurship",
  ],
  Humanities: [
    "Sociology", "Psychology", "Economics", "Geography", "History", "Political Science",
    "Rural Development", "Mass Communication", "Population Studies", "Philosophy",
    "Culture", "Linguistics", "Fine Arts", "Music", "Journalism",
  ],
  Education: [
    "Education", "Educational Psychology", "Foundations of Education", "Curriculum and Evaluation",
    "Child Development", "Teaching Methods", "Mathematics Education", "Science Education",
    "English Education", "Nepali Education", "Health Education",
  ],
};

async function ensureSubject(name: string) {
  return prisma.subject.upsert({
    where: { slug: slug(name) },
    update: {},
    create: { name, slug: slug(name) },
  });
}

async function assignToClass(level: number, subjectNames: string[]) {
  const schoolClass = await prisma.schoolClass.findUnique({ where: { level } });
  if (!schoolClass) throw new Error(`Class ${level} missing — run the main seed script first.`);

  let count = 0;
  for (const name of subjectNames) {
    const subject = await ensureSubject(name);
    // Prisma's compound-unique input for schoolClassId_subjectId_streamId
    // doesn't accept a literal null (even though the column is nullable),
    // so this dedupe has to be a manual lookup, same as the admin API route.
    const existing = await prisma.classSubject.findFirst({
      where: { schoolClassId: schoolClass.id, subjectId: subject.id, streamId: null },
    });
    if (!existing) {
      await prisma.classSubject.create({
        data: { schoolClassId: schoolClass.id, subjectId: subject.id, streamId: null },
      });
    }
    count++;
  }
  return count;
}

async function assignToStream(level: number, streamName: string, subjectNames: string[]) {
  const schoolClass = await prisma.schoolClass.findUnique({ where: { level } });
  if (!schoolClass) throw new Error(`Class ${level} missing — run the main seed script first.`);
  const stream = await prisma.stream.findUnique({ where: { name: streamName } });
  if (!stream) throw new Error(`Stream ${streamName} missing — run the main seed script first.`);

  let count = 0;
  for (const name of subjectNames) {
    const subject = await ensureSubject(name);
    await prisma.classSubject.upsert({
      where: { schoolClassId_subjectId_streamId: { schoolClassId: schoolClass.id, subjectId: subject.id, streamId: stream.id } },
      update: {},
      create: { schoolClassId: schoolClass.id, subjectId: subject.id, streamId: stream.id },
    });
    count++;
  }
  return count;
}

async function main() {
  let total = 0;

  for (const level of [1, 2, 3]) total += await assignToClass(level, COMMON_1_3);
  for (const level of [4, 5]) total += await assignToClass(level, COMMON_4_5);
  for (const level of [6, 7, 8]) total += await assignToClass(level, COMMON_6_8);
  for (const level of [9, 10]) total += await assignToClass(level, [...CORE_9_10, ...OPTIONAL_9_10]);

  // Class 11/12 requires a streamId on every ClassSubject row (enforced by
  // /api/admin/class-subjects — a streamed class can't hold a bare,
  // stream-less assignment), so "compulsory" subjects are assigned into
  // *each* stream individually, matching how the source curriculum lists
  // them (repeated under every stream) rather than once at the class level.
  for (const level of [11, 12]) {
    for (const [streamName, subjects] of Object.entries(STREAM_SUBJECTS)) {
      total += await assignToStream(level, streamName, [...COMPULSORY_11_12, ...subjects]);
    }
  }

  console.log(`Done — ${total} class-subject assignments (subjects deduplicated and reused across classes/streams).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
