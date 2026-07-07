import { PrismaClient, MembershipRole, ChannelType, TaskStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      username: "alice",
      name: "Alice Johnson",
      timezone: "America/New_York",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      username: "bob",
      name: "Bob Smith",
      timezone: "America/Chicago",
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {},
    create: {
      email: "charlie@example.com",
      username: "charlie",
      name: "Charlie Davis",
      timezone: "America/Los_Angeles",
    },
  });

  const engineering = await prisma.team.upsert({
    where: { slug: "engineering" },
    update: {},
    create: {
      name: "Engineering",
      slug: "engineering",
      description: "The engineering department",
    },
  });

  await prisma.teamMember.createMany({
    data: [
      { userId: alice.id, teamId: engineering.id, role: MembershipRole.OWNER },
      { userId: bob.id, teamId: engineering.id, role: MembershipRole.MEMBER },
      { userId: charlie.id, teamId: engineering.id, role: MembershipRole.MEMBER },
    ],
    skipDuplicates: true,
  });

  const general = await prisma.channel.upsert({
    where: { teamId_name: { teamId: engineering.id, name: "general" } },
    update: {},
    create: {
      name: "general",
      description: "General discussion",
      type: ChannelType.PUBLIC,
      teamId: engineering.id,
    },
  });

  const deployments = await prisma.channel.upsert({
    where: { teamId_name: { teamId: engineering.id, name: "deployments" } },
    update: {},
    create: {
      name: "deployments",
      description: "Deployment notifications and discussion",
      type: ChannelType.PUBLIC,
      teamId: engineering.id,
    },
  });

  const msg = await prisma.message.create({
    data: {
      content: "Welcome to the #general channel!",
      authorId: alice.id,
      channelId: general.id,
    },
  });

  await prisma.threadReply.create({
    data: {
      content: "Thanks Alice! Excited to be here.",
      authorId: bob.id,
      messageId: msg.id,
    },
  });

  const dm = await prisma.directMessage.create({
    data: {
      isGroup: false,
    },
  });

  await prisma.dmMember.createMany({
    data: [
      { userId: alice.id, dmId: dm.id },
      { userId: bob.id, dmId: dm.id },
    ],
  });

  await prisma.message.create({
    data: {
      content: "Hey Bob, have you reviewed the PR?",
      authorId: alice.id,
      dmId: dm.id,
    },
  });

  const event = await prisma.event.create({
    data: {
      title: "Sprint Planning",
      description: "Weekly sprint planning session",
      startTime: new Date("2026-07-08T14:00:00Z"),
      endTime: new Date("2026-07-08T15:00:00Z"),
      creatorId: alice.id,
    },
  });

  await prisma.eventAttendee.createMany({
    data: [
      { userId: alice.id, eventId: event.id, status: "ACCEPTED" },
      { userId: bob.id, eventId: event.id, status: "PENDING" },
      { userId: charlie.id, eventId: event.id, status: "ACCEPTED" },
    ],
  });

  await prisma.task.createMany({
    data: [
      { title: "Set up CI/CD pipeline", status: TaskStatus.IN_PROGRESS, priority: "HIGH", assigneeId: bob.id, teamId: engineering.id, createdById: alice.id },
      { title: "Implement user auth", status: TaskStatus.DONE, priority: "HIGH", assigneeId: alice.id, teamId: engineering.id, createdById: alice.id },
      { title: "Write API documentation", status: TaskStatus.TODO, priority: "MEDIUM", assigneeId: charlie.id, teamId: engineering.id, createdById: alice.id },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
