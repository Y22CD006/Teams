
const fs = require("fs");
let content = fs.readFileSync("prisma/schema.prisma", "utf8");
if (!content.includes("model PubSubEvent")) {
  content += `\n\nmodel PubSubEvent {
  id        Int      @id @default(autoincrement())
  channel   String
  message   String
  createdAt DateTime @default(now())
}\n`;
  fs.writeFileSync("prisma/schema.prisma", content);
  console.log("Added PubSubEvent model");
} else {
  console.log("PubSubEvent already exists");
}

