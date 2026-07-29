const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

content = content.replace(/\s*meetingParticipations\s+MeetingParticipant\[\]/g, '');
content = content.replace(/\s*meetingId\s+String\?/g, '');
content = content.replace(/\s*meeting\s+Meeting\?\s+@relation\(fields:\s*\[meetingId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/g, '');
content = content.replace(/\s*meetings\s+Meeting\[\]/g, '');

content = content.replace(/model Meeting \{[^]*?\}/g, '');
content = content.replace(/enum MeetingStatus \{[^]*?\}/g, '');
content = content.replace(/model MeetingParticipant \{[^]*?\}/g, '');
content = content.replace(/model MeetingAnalytics \{[^]*?\}/g, '');

const callModel = `
model Call {
  id         String     @id @default(cuid())
  roomId     String     @unique
  callerId   String
  receiverId String
  callType   String     // VOICE or VIDEO
  status     String     // ONGOING, COMPLETED, MISSED, REJECTED
  duration   Int?       // in seconds
  startTime  DateTime   @default(now())
  endTime    DateTime?
  createdAt  DateTime   @default(now())

  caller     User       @relation("CallsMade", fields: [callerId], references: [id], onDelete: Cascade)
  receiver   User       @relation("CallsReceived", fields: [receiverId], references: [id], onDelete: Cascade)

  @@index([callerId])
  @@index([receiverId])
}
`;

content += callModel;

content = content.replace(/model User \{/, `model User {\n  callsMade          Call[]          @relation("CallsMade")\n  callsReceived      Call[]          @relation("CallsReceived")`);

fs.writeFileSync('prisma/schema.prisma', content);
