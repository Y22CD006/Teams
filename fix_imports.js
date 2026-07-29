
const fs = require("fs");
const files = [
  "lib/actions/team-actions.ts",
  "lib/actions/task-actions.ts",
  "lib/actions/meeting-actions.ts",
  "lib/actions/channel-actions.ts",
  "lib/actions/calendar-actions.ts"
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/import \{ getAuthUserId, requireAuth \} from "@\/lib\/clerk";/g, `import { auth } from "@/lib/auth";`);
  content = content.replace(/const userId = await getAuthUserId\(\);/g, `const { userId } = await auth();`);
  content = content.replace(/requireAuth\(userId\);/g, `if (!userId) throw new Error("Unauthorized");`);
  fs.writeFileSync(file, content);
}
console.log("Replaced in 5 files");

