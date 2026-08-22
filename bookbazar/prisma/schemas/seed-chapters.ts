import "dotenv/config";
import prisma from "../../lib/prisma";

// A starting chapter list for the highest-traffic subjects — Class 10 and
// Class 11 core/stream subjects. Everything else starts chapterless (an
// upload without a chapter is still allowed) and admin can add more
// chapters anytime from Academic Management → Subjects → Manage chapters.

const CHAPTERS: Record<string, string[]> = {
  "Science and Technology": [
    "Force and Motion", "Heat and Temperature", "Light", "Current Electricity",
    "Chemical Reactions", "Acids, Bases and Salts", "Classification of Living Things",
    "Human Physiology", "Environment and Its Resources",
  ],
  "Computer Science / ICT": [
    "Introduction to Computers", "Word Processing", "Spreadsheets", "Presentation Software",
    "Number Systems", "Introduction to Programming", "Internet and E-mail", "Computer Ethics",
  ],
  "Mathematics": [
    "Algebra", "Sets", "Mensuration", "Trigonometry", "Coordinate Geometry",
    "Statistics", "Probability", "Vectors", "Calculus",
  ],
  "Physics": [
    "Mechanics", "Heat and Thermodynamics", "Wave and Optics", "Electricity and Magnetism",
    "Modern Physics",
  ],
  "Chemistry": [
    "General and Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry",
    "Reaction Kinetics", "Electrochemistry",
  ],
  "Biology": [
    "Cell Biology", "Genetics", "Ecology", "Plant Physiology", "Animal Physiology",
    "Evolution",
  ],
  "Accountancy": [
    "Introduction to Accounting", "Journal and Ledger", "Trial Balance",
    "Final Accounts", "Partnership Accounts", "Company Accounts",
  ],
  "Economics": [
    "Introduction to Economics", "Demand and Supply", "Production and Cost",
    "Market Structures", "National Income", "Money and Banking", "Public Finance",
  ],
};

async function main() {
  let created = 0;
  let skipped = 0;

  for (const [subjectName, chapters] of Object.entries(CHAPTERS)) {
    const subject = await prisma.subject.findFirst({ where: { name: subjectName } });
    if (!subject) {
      console.log(`Skipping "${subjectName}" — no matching subject in the catalog.`);
      continue;
    }

    for (let i = 0; i < chapters.length; i++) {
      const title = chapters[i];
      const existing = await prisma.chapter.findFirst({ where: { subjectId: subject.id, title } });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.chapter.create({ data: { subjectId: subject.id, title, sortOrder: i } });
      created++;
    }
  }

  console.log(`Done — ${created} chapters created, ${skipped} already existed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
