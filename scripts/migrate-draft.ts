import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.$queryRaw<Array<{ cnt: bigint }>>`SELECT COUNT(*) as cnt FROM "ExpenseReport" WHERE status = 'DRAFT'`;
  console.log("DRAFT records found:", Number(count[0].cnt));

  if (Number(count[0].cnt) > 0) {
    const result = await prisma.$executeRaw`UPDATE "ExpenseReport" SET status = 'PENDING_MANAGER' WHERE status = 'DRAFT'`;
    console.log("Updated rows:", result);
  } else {
    console.log("No DRAFT records to update.");
  }

  const remaining = await prisma.$queryRaw<Array<{ cnt: bigint }>>`SELECT COUNT(*) as cnt FROM "ExpenseReport" WHERE status = 'DRAFT'`;
  console.log("Remaining DRAFT:", Number(remaining[0].cnt));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
