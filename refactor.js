const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('c:/Users/Administrator/OneDrive/Desktop/Teams_project/Teams/app/api');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('@/lib/auth')) {
    content = content.replace(/import \{.*?getSession.*?\} from "@\/lib\/auth";/g, 'import { auth } from "@clerk/nextjs/server";');
    content = content.replace(/const session = await getSession\(\);/g, 'const { userId } = await auth();\n  const session = userId ? { userId } : null;');
    fs.writeFileSync(file, content);
  }
}
