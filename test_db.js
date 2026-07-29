
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function run() {
  const events = await prisma.pubSubEvent.findMany();
  console.log(events);
}
run();

